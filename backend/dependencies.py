"""Dependencias das rotas: quem esta logado no dashboard e o que pode fazer.

Uso nos routers:
- dependencies=LOGGED        qualquer pessoa logada (Coordenacao ou Apoio)
- dependencies=COORDINATION  so Coordenacao
Rotas do player (display, heartbeat, /ws/player) continuam abertas ate o pareamento.
"""

from typing import Annotated

from fastapi import Depends, Request, WebSocket

from errors import ApiError
from models.store import store
from schemas.user import User
from services.auth import token_hash

SESSION_COOKIE = "em_session"


def user_from_token(token: str | None) -> User | None:
    if not token:
        return None
    return store.find_session_user(token_hash(token))


def current_user(request: Request) -> User:
    """Usuario da sessao (cookie). Sem sessao valida: 401."""
    user = user_from_token(request.cookies.get(SESSION_COOKIE))
    if user is None:
        raise ApiError(401, "Faça login para continuar.")
    return user


# Uso nas rotas: async def rota(user: CurrentUser): ...
CurrentUser = Annotated[User, Depends(current_user)]


def require_coordination(user: CurrentUser) -> User:
    """So o perfil Coordenacao (catalogo, configuracoes e posicoes na planta)."""
    if user.role != "coordination":
        raise ApiError(403, "Seu perfil não permite esta ação.")
    return user


LOGGED = [Depends(current_user)]
COORDINATION = [Depends(require_coordination)]


def socket_user(websocket: WebSocket) -> User | None:
    """Usuario do WebSocket do dashboard (mesmo cookie). None = sem sessao."""
    return user_from_token(websocket.cookies.get(SESSION_COOKIE))