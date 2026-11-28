from typing import Any, Literal

from schemas.base import CamelModel

# Imagens agora tem catalogo proprio (schemas/image.py).
ExperienceType = Literal["web"]
ExperienceOrientation = Literal["landscape", "portrait", "any"]
# Setores (lista fechada). A IA usa este campo para recomendar experiencias.
#   finance Financeiro | retail Varejo | emerging_tech Tecnologias Emergentes | other Outro
ExperienceSector = Literal["finance", "retail", "emerging_tech", "other"]


class Experience(CamelModel):
    id: str
    title: str
    description: str
    url: str
    type: ExperienceType
    orientation: ExperienceOrientation
    sectors: list[ExperienceSector]
    tags: list[str]  # livres, ate 5
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
    sectors: Any = None
    tags: Any = None

class ExperienceActiveUpdate(CamelModel):
    """Corpo do PUT /api/experiences/{id}/active."""

    active: Any = None
