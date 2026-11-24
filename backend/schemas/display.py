"""O que a tela deve exibir agora (resposta do GET /api/clients/{id}/display).

Prioridade: Em pausa > imagem > experiencia > stand-by.
Estados locais do player (carregando, falha de conteudo, sem conexao) nao
vem daqui: o proprio player os mostra.
"""

from typing import Annotated, Literal, Union

from pydantic import Field

from schemas.base import CamelModel
from schemas.experience import Experience
from schemas.image import Image


class DisplayPaused(CamelModel):
    """Modo foco ativo e esta nao e a tela em foco: tela preta."""

    kind: Literal["paused"] = "paused"


class DisplayImage(CamelModel):
    kind: Literal["image"] = "image"
    image: Image


class DisplayExperience(CamelModel):
    kind: Literal["experience"] = "experience"
    experience: Experience


class DisplayStandby(CamelModel):
    """Sem conteudo atribuido. image = imagem de stand-by global (null = preto)."""

    kind: Literal["standby"] = "standby"
    image: Image | None = None


DisplayState = Annotated[
    Union[DisplayPaused, DisplayImage, DisplayExperience, DisplayStandby],
    Field(discriminator="kind"),
]