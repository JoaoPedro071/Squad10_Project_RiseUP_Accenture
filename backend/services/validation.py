"""Validacao de experiencias. Porta de dashboard/lib/validation.ts (mesmas regras e mensagens)."""

from typing import Any
from urllib.parse import urlparse

TYPES = ("web", "image")
ORIENTATIONS = ("landscape", "portrait", "any")


def _text(value: Any) -> str:
    return "" if value is None else str(value)


def is_valid_url(value: str) -> bool:
    # Caminhos internos como /demo sao aceitos para a demonstracao.
    if value.startswith("/") and not value.startswith("//"):
        return True
    try:
        parsed = urlparse(value)
    except ValueError:
        return False
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def validate_experience(data: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    title = _text(data.get("title")).strip()
    description = _text(data.get("description"))
    url = _text(data.get("url")).strip()

    if not title:
        errors["title"] = "Informe o título da experiência."
    elif len(title) > 80:
        errors["title"] = "Use no máximo 80 caracteres no título."

    if len(description) > 300:
        errors["description"] = "Use no máximo 300 caracteres na descrição."

    if not url:
        errors["url"] = "Informe o endereço do conteúdo."
    elif not is_valid_url(url):
        errors["url"] = "Use um endereço começando com http:// ou https://."

    if data.get("type") not in TYPES:
        errors["type"] = "Escolha o tipo de conteúdo."
    if data.get("orientation") not in ORIENTATIONS:
        errors["orientation"] = "Escolha a orientação."
    return errors
