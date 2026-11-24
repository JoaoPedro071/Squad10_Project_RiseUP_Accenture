from typing import Any, Literal

from schemas.base import CamelModel

ImageOrientation = Literal["landscape", "portrait", "any"]


class Image(CamelModel):
    """Imagem do catalogo (secao "Imagens" pedida pelo Bruno).

    Usada de dois jeitos: atribuida a uma tela (displayImg + imgId) ou como
    imagem de stand-by global (Etapa 3).
    """

    id: str
    title: str
    description: str
    url: str
    orientation: ImageOrientation
    active: bool


class ImageCreate(CamelModel):
    """Corpo do POST /api/images.

    Campos Any de proposito: quem valida (e devolve as mensagens em portugues
    por campo) e services/validation.py, igual as experiencias.
    """

    title: Any = None
    description: Any = None
    url: Any = None
    orientation: Any = None


class ImageActiveUpdate(CamelModel):
    """Corpo do PUT /api/images/{id}/active."""

    active: Any = None