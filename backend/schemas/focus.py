from typing import Any

from schemas.base import CamelModel
from schemas.client import Client


class FocusState(CamelModel):
    """Modo foco ativo: uma camada por cima das atribuicoes.

    A tela em foco segue exibindo o seu conteudo; todas as outras ficam
    Em pausa (tela preta). Nenhuma atribuicao e alterada.
    """

    client_id: str  # tela que está apresentando


class FocusStart(CamelModel):
    client_id: Any = None


class FocusResponse(CamelModel):
    focus: FocusState | None = None
    clients: list[Client]
