"""Validacao de experiencias. Porta de dashboard/lib/validation.ts (mesmas regras e mensagens)."""

from typing import Any
from urllib.parse import urlparse

TYPES = ("web",)  # imagens tem catalogo proprio
ORIENTATIONS = ("landscape", "portrait", "any")
SECTORS = ("finance", "retail", "emerging_tech", "other")
MAX_TAGS = 5
MAX_TAG_LENGTH = 30


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


def clean_sectors(value: Any) -> list[str]:
    """Setores validos, sem repeticao, na ordem de SECTORS."""
    if not isinstance(value, list):
        return []
    return [sector for sector in SECTORS if sector in value]


def clean_tags(value: Any) -> list[str]:
    """Tags sem espacos nas pontas, sem vazias e sem repetidas
    (ignora maiusculas e minusculas)."""
    if not isinstance(value, list):
        return []
    tags: list[str] = []
    seen: set[str] = set()
    for item in value:
        tag = _text(item).strip()
        if tag and tag.casefold() not in seen:
            seen.add(tag.casefold())
            tags.append(tag)
    return tags


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

    sectors = data.get("sectors")
    if not isinstance(sectors, list) or not sectors:
        errors["sectors"] = "Escolha ao menos um setor."
    elif any(sector not in SECTORS for sector in sectors):
        errors["sectors"] = "Escolha setores da lista."

    tags = data.get("tags")
    if tags is not None and not isinstance(tags, list):
        errors["tags"] = "Informe as tags como uma lista."
    else:
        cleaned = clean_tags(tags)
        if len(cleaned) > MAX_TAGS:
            errors["tags"] = f"Use no máximo {MAX_TAGS} tags."
        elif any(len(tag) > MAX_TAG_LENGTH for tag in cleaned):
            errors["tags"] = f"Use no máximo {MAX_TAG_LENGTH} caracteres por tag."
    return errors

def validate_image(data: dict[str, Any]) -> dict[str, str]:
    errors: dict[str, str] = {}
    title = _text(data.get("title")).strip()
    description = _text(data.get("description"))
    url = _text(data.get("url")).strip()

    if not title:
        errors["title"] = "Informe o título da imagem."
    elif len(title) > 80:
        errors["title"] = "Use no máximo 80 caracteres no título."

    if len(description) > 300:
        errors["description"] = "Use no máximo 300 caracteres na descrição."

    if not url:
        errors["url"] = "Informe o endereço da imagem."
    elif not is_valid_url(url):
        errors["url"] = "Use um endereço começando com http:// ou https://."

    if data.get("orientation") not in ORIENTATIONS:
        errors["orientation"] = "Escolha a orientação."
    return errors