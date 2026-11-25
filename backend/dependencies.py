"""Dependencias das rotas: quem esta logado no dashboard."""

from typing import Annotated

from fastapi import Depends, Request

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