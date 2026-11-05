from typing import Any, Literal

from schemas.base import CamelModel

ExperienceType = Literal["web", "image"]
ExperienceOrientation = Literal["landscape", "portrait", "any"]


class Experience(CamelModel):
    id: str
    title: str
    description: str
    url: str
    type: ExperienceType
    orientation: ExperienceOrientation
    active: bool


class ExperienceCreate(CamelModel):
    """Corpo do POST /api/experiences.

    Os campos sao Any de proposito: quem valida (e devolve as mensagens em
    portugues por campo) e services/validation.py, igual ao front.
    """

    title: Any = None
    description: Any = None
    url: Any = None
    type: Any = None
    orientation: Any = None
