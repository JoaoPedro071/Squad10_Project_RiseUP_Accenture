"""Armazenamento em memoria (fatia 1).

Equivale a dashboard/lib/store.ts. Na fatia 2 este modulo vira a camada de
persistencia (SQLAlchemy) mantendo a mesma interface publica, entao os routers
nao precisam mudar. Como o estado vive no processo, rode com UM worker.
"""

import time
import uuid
from datetime import datetime, timedelta, timezone

from config import HEARTBEAT_TIMEOUT_SECONDS
from models.seed import (
    ONLINE_AT_START,
    seed_clients,
    seed_experiences,
    seed_images,
)
from schemas.client import Client
from schemas.display import (
    DisplayExperience,
    DisplayImage,
    DisplayPaused,
    DisplayStandby,
    DisplayState,
)
from schemas.experience import Experience
from schemas.focus import FocusState
from schemas.image import Image
from schemas.settings import Settings


class InMemoryStore:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        # Relogio substituivel nos testes (para simular o tempo passando).
        self._clock = lambda: datetime.now(timezone.utc)
        self._experiences = seed_experiences()
        self._images = seed_images()
        self._clients = seed_clients()
        self._focus: FocusState | None = None
        self._settings = Settings()
        # As telas do seed marcadas como online "acabaram de dar sinal".
        # Sem o player rodando, elas ficam desligadas apos o tempo limite.
        for client in self._clients:
            if client.id in ONLINE_AT_START:
                client.last_seen_at = self._clock()

    # --- leitura ---
    def list_experiences(self) -> list[Experience]:
        return list(self._experiences)

    def list_images(self) -> list[Image]:
        return list(self._images)

    def list_clients(self) -> list[Client]:
        for client in self._clients:
            self._refresh_status(client)
        return list(self._clients)

    def find_experience(self, experience_id: str) -> Experience | None:
        return next((e for e in self._experiences if e.id == experience_id), None)

    def find_image(self, image_id: str) -> Image | None:
        return next((i for i in self._images if i.id == image_id), None)

    def find_client(self, client_id: str) -> Client | None:
        client = next((c for c in self._clients if c.id == client_id), None)
        if client is not None:
            self._refresh_status(client)
        return client

    # --- sinal de vida ---
    def is_alive(self, client: Client) -> bool:
        """Deu sinal de vida dentro do tempo limite."""
        limit = timedelta(seconds=HEARTBEAT_TIMEOUT_SECONDS)
        seen = client.last_seen_at
        return seen is not None and self._clock() - seen <= limit

    def _shown_orientation(self, client: Client) -> str | None:
        """Orientacao do conteudo que a tela exibe agora (None = nada exibido)."""
        if client.display_img and client.img_id:
            image = self.find_image(client.img_id)
            return image.orientation if image else None
        if client.current_experience_id:
            experience = self.find_experience(client.current_experience_id)
            return experience.orientation if experience else None
        return None

    def _refresh_status(self, client: Client) -> None:
        """Calcula o estado da tela. Prioridade:
        Desligada > Em pausa > Erro > Em uso > Stand-by."""
        content = self._shown_orientation(client)
        client.orientation_mismatch = (
            content is not None
            and content != "any"
            and client.reported_orientation is not None
            and content != client.reported_orientation
        )
        if not self.is_alive(client):
            client.status = "off"
        elif self.is_paused(client):
            client.status = "paused"
        elif client.orientation_mismatch:
            client.status = "error"
        elif content is not None:
            client.status = "busy"
        else:
            client.status = "standby"

    def record_heartbeat(
        self, client_id: str, orientation: str, resolution: str | None
    ) -> Client | None:
        """A tela avisou que esta viva. Atualiza o que ela informou.
        A atribuicao de conteudo nao muda: ao voltar, a tela exibe o mesmo."""
        client = next((c for c in self._clients if c.id == client_id), None)
        if client is None:
            return None
        client.last_seen_at = self._clock()
        client.reported_orientation = orientation
        if resolution is not None:
            client.reported_resolution = resolution
        self._refresh_status(client)
        return client

    # --- escrita ---
    def update_client(
        self,
        client_id: str,
        *,
        x: float | None = None,
        y: float | None = None,
        locked: bool | None = None,
    ) -> Client | None:
        client = self.find_client(client_id)
        if client is None:
            return None
        if x is not None:
            client.x = x
        if y is not None:
            client.y = y
        if locked is not None:
            client.locked = locked
        return client

    def set_content(
        self,
        client_id: str,
        *,
        current_experience_id: str | None,
        img_id: str | None,
        display_img: bool,
    ) -> Client | None:
        """Grava o conteudo da tela. Diferente de update_client, aqui None
        significa "remover", entao da para deixar a tela sem conteudo."""
        client = self.find_client(client_id)
        if client is None:
            return None
        client.current_experience_id = current_experience_id
        client.img_id = img_id
        client.display_img = display_img
        # Durante o Modo foco a tela segue Em pausa: a troca fica guardada
        # e aparece quando o foco terminar.
        self._refresh_status(client)
        return client

    def create_experience(self, data: dict) -> Experience:
        experience = Experience(
            id=f"exp-{int(time.time() * 1000)}",
            title=str(data["title"]).strip(),
            description=str(data.get("description") or "").strip(),
            url=str(data["url"]).strip(),
            type=data["type"],
            orientation=data["orientation"],
            active=True,
        )
        self._experiences.append(experience)
        return experience

    def create_image(self, data: dict) -> Image:
        image = Image(
            # uuid evita ids repetidos quando duas imagens sao criadas no mesmo instante.
            id=f"img-{uuid.uuid4().hex[:8]}",
            title=str(data["title"]).strip(),
            description=str(data.get("description") or "").strip(),
            url=str(data["url"]).strip(),
            orientation=data["orientation"],
            active=True,
        )
        self._images.append(image)
        return image

    def set_image_active(self, image_id: str, active: bool) -> Image | None:
        image = self.find_image(image_id)
        if image is None:
            return None
        image.active = active
        return image

    # --- configuracoes globais ---
    def get_settings(self) -> Settings:
        return self._settings

    def set_standby_image(self, image_id: str | None) -> Settings:
        self._settings.standby_image_id = image_id
        return self._settings

    # --- Modo foco: camada por cima das atribuicoes ---
    def get_focus(self) -> FocusState | None:
        return self._focus

    def is_paused(self, client: Client) -> bool:
        """Em pausa = Modo foco ativo e esta nao e a tela em foco.
        Vale tambem para quem reconecta durante o foco."""
        return self._focus is not None and client.id != self._focus.client_id

    def start_focus(self, client_id: str) -> FocusState | str:
        """Devolve o FocusState ou o codigo do erro: not_found, offline, already_active."""
        if self._focus is not None:
            return "already_active"
        focused = self.find_client(client_id)
        if focused is None:
            return "not_found"
        if not self.is_alive(focused):
            return "offline"
        # Nada e alterado nas telas: a pausa e calculada a partir do foco.
        self._focus = FocusState(client_id=client_id)
        return self._focus

    def end_focus(self) -> bool:
        """Cada tela volta exatamente ao que tem atribuido."""
        if self._focus is None:
            return False
        self._focus = None
        return True


    # --- o que a tela do monitor deve mostrar agora ---
    def get_display_state(self, client_id: str) -> DisplayState | None:
        """Prioridade: Em pausa > imagem > experiencia > stand-by.

        Item inativado continua sendo exibido ate ser trocado (EC18): a
        inativacao so impede novas atribuicoes.
        """
        client = self.find_client(client_id)
        if client is None:
            return None
        if self.is_paused(client):
            return DisplayPaused()
        if client.display_img and client.img_id:
            image = self.find_image(client.img_id)
            if image:
                return DisplayImage(image=image)
        if client.current_experience_id:
            experience = self.find_experience(client.current_experience_id)
            if experience:
                return DisplayExperience(experience=experience)
        standby_id = self._settings.standby_image_id
        standby = self.find_image(standby_id) if standby_id else None
        return DisplayStandby(image=standby)


store = InMemoryStore()