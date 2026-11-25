"""Login do dashboard: entrar, sair e saber quem esta logado."""

from fastapi import APIRouter, Request, Response

from config import COOKIE_SECURE, SESSION_HOURS
from dependencies import SESSION_COOKIE, CurrentUser
from errors import ApiError
from models.store import store
from schemas.user import LoginRequest, User
from services.auth import (
    login_limiter,
    new_token,
    normalize_email,
    token_hash,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

WRONG_LOGIN = "E-mail ou senha incorretos."


@router.post("/login", response_model=User)
async def login(payload: LoginRequest, request: Request, response: Response):
    """Confere e-mail e senha e grava o cookie de sessao (HttpOnly).
    A mensagem de erro e a mesma para e-mail inexistente e senha errada."""
    email = payload.email if isinstance(payload.email, str) else ""
    password = payload.password if isinstance(payload.password, str) else ""
    if not email.strip() or not password:
        raise ApiError(422, "Informe e-mail e senha.")

    address = request.client.host if request.client else "?"
    key = f"{address}|{normalize_email(email)}"
    if login_limiter.blocked(key):
        raise ApiError(429, "Muitas tentativas. Aguarde um minuto e tente de novo.")

    found = store.find_login(email)
    if not verify_password(found[1] if found else None, password):
        login_limiter.fail(key)
        raise ApiError(401, WRONG_LOGIN)
    login_limiter.clear(key)

    user = found[0]
    token = new_token()
    store.create_session(user.id, token_hash(token))
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=int(SESSION_HOURS * 3600),
        httponly=True,  # o JavaScript da pagina nao consegue ler
        secure=COOKIE_SECURE,  # so por HTTPS em producao
        samesite="lax",  # nao vai junto em pedidos vindos de outros sites
        path="/",
    )
    return user


@router.post("/logout", status_code=204)
async def logout(request: Request):
    """Encerra a sessao na hora (o token deixa de valer) e apaga o cookie."""
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        store.delete_session(token_hash(token))
    response = Response(status_code=204)
    response.delete_cookie(SESSION_COOKIE, path="/")
    return response


@router.get("/me", response_model=User)
async def me(user: CurrentUser):
    return user