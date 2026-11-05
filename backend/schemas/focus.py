from typing import Any

from schemas.base import CamelModel
from schemas.client import Client


class FocusState(CamelModel):
    client_id: str  # tela que está apresentando
    affected_ids: list[str]  # telas que foram apagadas (estavam ligadas)
    offline_ids: list[str]  # telas offline, que não puderam ser apagadas


class FocusStart(CamelModel):
    client_id: Any = None


class FocusResponse(CamelModel):
    focus: FocusState | None = None
    clients: list[Client]
