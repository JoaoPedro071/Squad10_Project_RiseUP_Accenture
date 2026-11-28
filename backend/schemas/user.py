from typing import Any, Literal

from schemas.base import CamelModel

# Perfis de acesso (US-02):
#   coordination  Coordenacao  pode tudo
#   support       Apoio        troca conteudo, Modo foco e identificar telas
UserRole = Literal["coordination", "support"]


class User(CamelModel):
    """Usuario como a API devolve (nunca inclui a senha)."""

    id: str
    email: str
    name: str
    role: UserRole
    active: bool


class LoginRequest(CamelModel):
    """Corpo do POST /api/auth/login."""

    email: Any = None
    password: Any = None