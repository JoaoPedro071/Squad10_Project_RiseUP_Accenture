"""Armazenamento em memoria (fatia 1).

Equivale a dashboard/lib/store.ts. Na fatia 2 este modulo vira a camada de
persistencia (SQLAlchemy) mantendo a mesma interface publica, entao os routers
nao precisam mudar. Como o estado vive no processo, rode com UM worker.
"""

import time

from models.seed import seed_clients, seed_experiences
from schemas.client import Client
from schemas.display import (
    DisplayOff,
    DisplayShowing,
    DisplayState,
    DisplayWaiting,
)
from schemas.experience import Experience
from schemas.focus import FocusState


class InMemoryStore:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self._experiences = seed_experiences()
        self._clients = seed_clients()
        self._focus: FocusState | None = None

    # --- leitura ---
    def list_experiences(self) -> list[Experience]:
        return list(self._experiences)

    def list_clients(self) -> list[Client]:
        return list(self._clients)

    def find_experience(self, experience_id: str) -> Experience | None:
        return next((e for e in self._experiences if e.id == experience_id), None)

    def find_client(self, client_id: str) -> Client | None:
        return next((c for c in self._clients if c.id == client_id), None)

    # --- escrita ---
    def update_client(
        self,
        client_id: str,
        *,
        current_experience_id: str | None = None,
        display_off: bool | None = None,
        x: float | None = None,
        y: float | None = None,
        locked: bool | None = None,
    ) -> Client | None:
        client = self.find_client(client_id)
        if client is None:
            return None
        if current_experience_id is not None:
            client.current_experience_id = current_experience_id
        if display_off is not None:
            client.display_off = display_off
        if x is not None:
            client.x = x
        if y is not None:
            client.y = y
        if locked is not None:
            client.locked = locked
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

    # --- Modo foco: uma tela apresenta e as outras ligadas apagam ---
    def get_focus(self) -> FocusState | None:
        return self._focus

    def start_focus(self, client_id: str) -> FocusState | str:
        """Devolve o FocusState ou o codigo do erro: not_found, offline, already_active."""
        if self._focus is not None:
            return "already_active"
        focused = self.find_client(client_id)
        if focused is None:
            return "not_found"
        if focused.status == "offline":
            return "offline"

        others = [c for c in self._clients if c.id != focused.id]
        to_darken = [c for c in others if c.status == "online" and not c.display_off]
        offline = [c for c in others if c.status == "offline"]

        # So apaga as que estavam ligadas; as ja desligadas continuam como estao.
        for client in to_darken:
            client.display_off = True

        self._focus = FocusState(
            client_id=client_id,
            affected_ids=[c.id for c in to_darken],
            offline_ids=[c.id for c in offline],
        )
        return self._focus

    def end_focus(self) -> bool:
        if self._focus is None:
            return False
        for client_id in self._focus.affected_ids:
            client = self.find_client(client_id)
            if client:
                client.display_off = False
        self._focus = None
        return True

    # --- o que a tela do monitor deve mostrar agora ---
    def get_display_state(self, client_id: str) -> DisplayState | None:
        client = self.find_client(client_id)
        if client is None:
            return None
        if client.display_off:
            return DisplayOff()
        experience = (
            self.find_experience(client.current_experience_id)
            if client.current_experience_id
            else None
        )
        if experience:
            return DisplayShowing(experience=experience)
        return DisplayWaiting()


store = InMemoryStore()
