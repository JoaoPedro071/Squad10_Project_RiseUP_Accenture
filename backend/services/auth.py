"""Senhas e tokens de sessao do login do dashboard.

- Senha: guardada so como hash argon2 (nunca em texto).
- Token de sessao: valor aleatorio enviado no cookie; no banco fica so o hash
  dele (SHA-256), entao quem ler o banco nao consegue entrar como ninguem.
"""

import hashlib
import re
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

ROLES = ("coordination", "support")
MIN_PASSWORD_LENGTH = 8
EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

_hasher = PasswordHasher()
# Hash de uma senha qualquer: usado quando o e-mail nao existe, para a
# resposta demorar o mesmo tempo (nao revela quais e-mails estao cadastrados).
_DUMMY_HASH = _hasher.hash("senha-que-nao-existe")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str | None, password: str) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password) and bool(password_hash)
    except (VerificationError, InvalidHashError):
        return False


def new_token() -> str:
    return secrets.token_urlsafe(32)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def normalize_email(email: str) -> str:
    return email.strip().lower()


def validate_new_user(email: str, name: str, password: str, role: str) -> list[str]:
    """Regras do cadastro de usuario. Devolve a lista de problemas (vazia = ok)."""
    problems = []
    if not EMAIL.match(normalize_email(email)):
        problems.append("E-mail inválido.")
    if not name.strip():
        problems.append("Informe o nome.")
    if len(password) < MIN_PASSWORD_LENGTH:
        problems.append(f"A senha precisa ter ao menos {MIN_PASSWORD_LENGTH} caracteres.")
    if role not in ROLES:
        problems.append("Perfil inválido: use coordination ou support.")
    return problems