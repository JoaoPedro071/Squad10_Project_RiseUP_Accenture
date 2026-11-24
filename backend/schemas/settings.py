from typing import Any

from schemas.base import CamelModel


class Settings(CamelModel):
    """Configuracoes globais do sistema."""

    # Imagem exibida pelas telas sem conteudo (stand-by). None = tela preta.
    standby_image_id: str | None = None


class SettingsUpdate(CamelModel):
    """Corpo do PUT /api/settings."""

    standby_image_id: Any = None