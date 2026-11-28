"""Armazenamento da API: banco de dados (SQLAlchemy) + sinal de vida em memoria.

Os routers usam so as funcoes publicas daqui; elas mantem os mesmos nomes
e formatos da versao em memoria.

O que fica no banco: experiencias, imagens, telas (posicao, trava, conteudo),
configuracoes e Modo foco. O que fica em memoria: o sinal de vida (ultimo
aviso, orientacao e resolucao). Ao reiniciar a API, as telas aparecem
desligadas ate o proximo aviso (em ate 5 s). Rode com UM worker.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from config import DATABASE_URL, HEARTBEAT_TIMEOUT_SECONDS, SESSION_HOURS
from db.database import Base, create_tables, make_engine
from db.tables import (
    ClientRow,
    ExperienceRow,
    FocusRow,
    ImageRow,
    SessionRow,
    SettingsRow,
    UserRow,
)
from models.seed import ONLINE_AT_START, seed_clients, seed_database
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
from schemas.user import User
from services.auth import normalize_email

FOCUS_ROW_ID = 1
SETTINGS_ROW_ID = 1


def _now() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class Signal:
    """Ultimo sinal de vida de uma tela (so em memoria)."""

    last_seen_at: datetime
    orientation: str
    resolution: str | None


class Store:
    def __init__(self, url: str = DATABASE_URL) -> None:
        # Relogio substituivel nos testes (para simular o tempo passando).
        self._clock = _now
        self._signals: dict[str, Signal] = {}
        self._engine = make_engine(url)
        create_tables(self._engine)
        with self._session() as s:
            seed_database(s)

    def reset(self) -> None:
        """Usado pelos testes: apaga tudo, grava o seed de novo e simula o
        sinal de vida das telas que comecam ligadas."""
        self._clock = _now
        Base.metadata.drop_all(self._engine)
        create_tables(self._engine)
        with self._session() as s:
            seed_database(s)
        self._signals = {
            c.id: Signal(self._clock(), c.reported_orientation, c.reported_resolution)
            for c in seed_clients()
            if c.id in ONLINE_AT_START
        }

    def close(self) -> None:
        """Fecha as conexoes com o banco."""
        self._engine.dispose()

    # --- apoio interno ---
    def _session(self) -> Session:
        return Session(self._engine, expire_on_commit=False)

    @staticmethod
    def _row(s: Session, table, item_id: str | None):
        """Busca uma linha pelo id de texto (ex.: "exp-1")."""
        if item_id is None:
            return None
        return s.scalar(select(table).where(table.id == item_id))

    def _focus_client_id(self, s: Session) -> str | None:
        focus = s.get(FocusRow, FOCUS_ROW_ID)
        return focus.client_id if focus else None

    def _to_client(self, s: Session, row: ClientRow) -> Client:
        """Junta a linha do banco com o sinal de vida e calcula o estado."""
        signal = self._signals.get(row.id)
        client = Client(
            id=row.id,
            name=row.name,
            current_experience_id=row.current_experience_id,
            img_id=row.img_id,
            display_img=row.display_img,
            x=row.x,
            y=row.y,
            locked=row.locked,
            reported_orientation=signal.orientation if signal else None,
            reported_resolution=signal.resolution if signal else None,
            last_seen_at=signal.last_seen_at if signal else None,
        )
        self._refresh_status(s, client)
        return client

    # --- leitura ---
    def list_experiences(self) -> list[Experience]:
        with self._session() as s:
            rows = s.scalars(select(ExperienceRow).order_by(ExperienceRow.pk))
            return [Experience.model_validate(r, from_attributes=True) for r in rows]

    def list_images(self) -> list[Image]:
        with self._session() as s:
            rows = s.scalars(select(ImageRow).order_by(ImageRow.pk))
            return [Image.model_validate(r, from_attributes=True) for r in rows]

    def list_clients(self) -> list[Client]:
        with self._session() as s:
            rows = s.scalars(select(ClientRow).order_by(ClientRow.pk)).all()
            return [self._to_client(s, r) for r in rows]

    def find_experience(self, experience_id: str) -> Experience | None:
        with self._session() as s:
            row = self._row(s, ExperienceRow, experience_id)
            return Experience.model_validate(row, from_attributes=True) if row else None

    def find_image(self, image_id: str) -> Image | None:
        with self._session() as s:
            row = self._row(s, ImageRow, image_id)
            return Image.model_validate(row, from_attributes=True) if row else None

    def find_client(self, client_id: str) -> Client | None:
        with self._session() as s:
            row = self._row(s, ClientRow, client_id)
            return self._to_client(s, row) if row else None

    # --- sinal de vida ---
    def is_alive(self, client: Client) -> bool:
        """Deu sinal de vida dentro do tempo limite."""
        limit = timedelta(seconds=HEARTBEAT_TIMEOUT_SECONDS)
        seen = client.last_seen_at
        return seen is not None and self._clock() - seen <= limit

    def _shown_orientation(self, s: Session, client: Client) -> str | None:
        """Orientacao do conteudo que a tela exibe agora (None = nada exibido)."""
        if client.display_img and client.img_id:
            image = self._row(s, ImageRow, client.img_id)
            return image.orientation if image else None
        if client.current_experience_id:
            experience = self._row(s, ExperienceRow, client.current_experience_id)
            return experience.orientation if experience else None
        return None

    def _refresh_status(self, s: Session, client: Client) -> None:
        """Calcula o estado da tela. Prioridade:
        Desligada > Em pausa > Erro > Em uso > Stand-by."""
        content = self._shown_orientation(s, client)
        client.orientation_mismatch = (
            content is not None
            and content != "any"
            and client.reported_orientation is not None
            and content != client.reported_orientation
        )
        focus_id = self._focus_client_id(s)
        if not self.is_alive(client):
            client.status = "off"
        elif focus_id is not None and client.id != focus_id:
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
        with self._session() as s:
            row = self._row(s, ClientRow, client_id)
            if row is None:
                return None
            previous = self._signals.get(client_id)
            if resolution is None and previous is not None:
                resolution = previous.resolution
            self._signals[client_id] = Signal(self._clock(), orientation, resolution)
            return self._to_client(s, row)

    # --- escrita ---
    def update_client(
        self,
        client_id: str,
        *,
        x: float | None = None,
        y: float | None = None,
        locked: bool | None = None,
    ) -> Client | None:
        with self._session() as s:
            row = self._row(s, ClientRow, client_id)
            if row is None:
                return None
            if x is not None:
                row.x = x
            if y is not None:
                row.y = y
            if locked is not None:
                row.locked = locked
            s.commit()
            return self._to_client(s, row)

    def set_content(
        self,
        client_id: str,
        *,
        current_experience_id: str | None,
        img_id: str | None,
        display_img: bool,
    ) -> Client | None:
        """Grava o conteudo da tela. Diferente de update_client, aqui None
        significa "remover", entao da para deixar a tela sem conteudo.
        Durante o Modo foco a tela segue Em pausa: a troca fica guardada
        e aparece quando o foco terminar."""
        with self._session() as s:
            row = self._row(s, ClientRow, client_id)
            if row is None:
                return None
            row.current_experience_id = current_experience_id
            row.img_id = img_id
            row.display_img = display_img
            s.commit()
            return self._to_client(s, row)

    def create_experience(self, data: dict) -> Experience:
        row = ExperienceRow(
            # uuid evita ids repetidos quando duas experiencias sao criadas juntas.
            id=f"exp-{uuid.uuid4().hex[:8]}",
            title=str(data["title"]).strip(),
            description=str(data.get("description") or "").strip(),
            url=str(data["url"]).strip(),
            type=data["type"],
            orientation=data["orientation"],
            active=True,
        )
        with self._session() as s:
            s.add(row)
            s.commit()
            return Experience.model_validate(row, from_attributes=True)


    def update_experience(self, experience_id: str, data: dict) -> Experience | None:
        """Troca todos os campos editaveis. O status (ativa) nao muda aqui."""
        with self._session() as s:
            row = self._row(s, ExperienceRow, experience_id)
            if row is None:
                return None
            row.title = str(data["title"]).strip()
            row.description = str(data.get("description") or "").strip()
            row.url = str(data["url"]).strip()
            row.type = data["type"]
            row.orientation = data["orientation"]
            s.commit()
            return Experience.model_validate(row, from_attributes=True)


    def set_experience_active(self, experience_id: str, active: bool) -> Experience | None:
        with self._session() as s:
            row = self._row(s, ExperienceRow, experience_id)
            if row is None:
                return None
            row.active = active
            s.commit()
            return Experience.model_validate(row, from_attributes=True)


    def create_image(self, data: dict) -> Image:
        row = ImageRow(
            id=f"img-{uuid.uuid4().hex[:8]}",
            title=str(data["title"]).strip(),
            description=str(data.get("description") or "").strip(),
            url=str(data["url"]).strip(),
            orientation=data["orientation"],
            active=True,
        )
        with self._session() as s:
            s.add(row)
            s.commit()
            return Image.model_validate(row, from_attributes=True)


    def update_image(self, image_id: str, data: dict) -> Image | None:
        """Troca todos os campos editaveis. O status (ativa) nao muda aqui."""
        with self._session() as s:
            row = self._row(s, ImageRow, image_id)
            if row is None:
                return None
            row.title = str(data["title"]).strip()
            row.description = str(data.get("description") or "").strip()
            row.url = str(data["url"]).strip()
            row.orientation = data["orientation"]
            s.commit()
            return Image.model_validate(row, from_attributes=True)


    def set_image_active(self, image_id: str, active: bool) -> Image | None:
        with self._session() as s:
            row = self._row(s, ImageRow, image_id)
            if row is None:
                return None
            row.active = active
            s.commit()
            return Image.model_validate(row, from_attributes=True)

    # --- configuracoes globais ---
    def get_settings(self) -> Settings:
        with self._session() as s:
            row = s.get(SettingsRow, SETTINGS_ROW_ID)
            return Settings(standby_image_id=row.standby_image_id if row else None)

    def set_standby_image(self, image_id: str | None) -> Settings:
        with self._session() as s:
            row = s.get(SettingsRow, SETTINGS_ROW_ID)
            if row is None:
                row = SettingsRow(id=SETTINGS_ROW_ID)
                s.add(row)
            row.standby_image_id = image_id
            s.commit()
            return Settings(standby_image_id=row.standby_image_id)

    # --- Modo foco: camada por cima das atribuicoes ---
    def get_focus(self) -> FocusState | None:
        with self._session() as s:
            client_id = self._focus_client_id(s)
            return FocusState(client_id=client_id) if client_id else None

    def is_paused(self, client: Client) -> bool:
        """Em pausa = Modo foco ativo e esta nao e a tela em foco.
        Vale tambem para quem reconecta durante o foco."""
        focus = self.get_focus()
        return focus is not None and client.id != focus.client_id

    def start_focus(self, client_id: str) -> FocusState | str:
        """Devolve o FocusState ou o codigo do erro: not_found, offline, already_active."""
        with self._session() as s:
            if self._focus_client_id(s) is not None:
                return "already_active"
            row = self._row(s, ClientRow, client_id)
            if row is None:
                return "not_found"
            if not self.is_alive(self._to_client(s, row)):
                return "offline"
            # Nada e alterado nas telas: a pausa e calculada a partir do foco.
            s.add(FocusRow(id=FOCUS_ROW_ID, client_id=client_id))
            s.commit()
            return FocusState(client_id=client_id)

    def end_focus(self) -> bool:
        """Cada tela volta exatamente ao que tem atribuido."""
        with self._session() as s:
            focus = s.get(FocusRow, FOCUS_ROW_ID)
            if focus is None:
                return False
            s.delete(focus)
            s.commit()
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
        standby_id = self.get_settings().standby_image_id
        standby = self.find_image(standby_id) if standby_id else None
        return DisplayStandby(image=standby)

    # --- usuarios e sessoes (login do dashboard) ---
    def create_user(self, email: str, name: str, password_hash: str, role: str) -> User:
        """Cria um usuario. Levanta ValueError se o e-mail ja existe."""
        email = normalize_email(email)
        with self._session() as s:
            if s.scalar(select(UserRow).where(UserRow.email == email)) is not None:
                raise ValueError("Já existe um usuário com este e-mail.")
            row = UserRow(
                id=f"usr-{uuid.uuid4().hex[:8]}",
                email=email,
                name=name.strip(),
                password_hash=password_hash,
                role=role,
                active=True,
            )
            s.add(row)
            s.commit()
            return User.model_validate(row, from_attributes=True)

    def find_login(self, email: str) -> tuple[User, str] | None:
        """Usuario ativo e o hash da senha, para conferir o login."""
        with self._session() as s:
            row = s.scalar(select(UserRow).where(UserRow.email == normalize_email(email)))
            if row is None or not row.active:
                return None
            return User.model_validate(row, from_attributes=True), row.password_hash

    def create_session(self, user_id: str, token_hash: str) -> None:
        expires_at = self._clock().timestamp() + SESSION_HOURS * 3600
        with self._session() as s:
            s.add(SessionRow(token_hash=token_hash, user_id=user_id, expires_at=expires_at))
            s.commit()

    def find_session_user(self, token_hash: str) -> User | None:
        """Dono da sessao, se ela existe, nao expirou e o usuario esta ativo."""
        with self._session() as s:
            session = s.scalar(select(SessionRow).where(SessionRow.token_hash == token_hash))
            if session is None or session.expires_at <= self._clock().timestamp():
                return None
            user = self._row(s, UserRow, session.user_id)
            if user is None or not user.active:
                return None
            return User.model_validate(user, from_attributes=True)

    def delete_expired_sessions(self) -> int:
        """Apaga do banco as sessoes vencidas. Devolve quantas apagou."""
        now = self._clock().timestamp()
        with self._session() as s:
            expired = s.scalars(select(SessionRow).where(SessionRow.expires_at <= now)).all()
            for session in expired:
                s.delete(session)
            s.commit()
            return len(expired)

    def delete_session(self, token_hash: str) -> None:
        with self._session() as s:
            session = s.scalar(select(SessionRow).where(SessionRow.token_hash == token_hash))
            if session is not None:
                s.delete(session)
                s.commit()

    
store = Store()