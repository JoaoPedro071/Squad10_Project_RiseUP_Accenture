"""Tabelas do banco.

Cada linha tem um "pk" numerico (so para manter a ordem de cadastro) e o "id"
de texto usado pela API (ex.: "exp-1", "cli-2").

O sinal de vida (ultimo aviso, orientacao e resolucao informadas) NAO fica
aqui: ele vive em memoria, porque muda a cada 5 s e a tela o reenvia sozinha.
"""

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class ExperienceRow(Base):
    __tablename__ = "experiences"

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(unique=True)
    title: Mapped[str]
    description: Mapped[str] = mapped_column(default="")
    url: Mapped[str]
    type: Mapped[str]
    orientation: Mapped[str]
    active: Mapped[bool] = mapped_column(default=True)


class ImageRow(Base):
    __tablename__ = "images"

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(unique=True)
    title: Mapped[str]
    description: Mapped[str] = mapped_column(default="")
    url: Mapped[str]
    orientation: Mapped[str]
    active: Mapped[bool] = mapped_column(default=True)


class ClientRow(Base):
    __tablename__ = "clients"

    pk: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    id: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str]
    # O que a tela deve exibir
    current_experience_id: Mapped[str | None] = mapped_column(
        ForeignKey("experiences.id"), default=None
    )
    img_id: Mapped[str | None] = mapped_column(ForeignKey("images.id"), default=None)
    display_img: Mapped[bool] = mapped_column(default=False)
    # Planta
    x: Mapped[float]
    y: Mapped[float]
    locked: Mapped[bool] = mapped_column(default=False)


class SettingsRow(Base):
    """Configuracoes globais: uma unica linha (id = 1)."""

    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    standby_image_id: Mapped[str | None] = mapped_column(
        ForeignKey("images.id"), default=None
    )


class FocusRow(Base):
    """Modo foco: a linha (id = 1) so existe enquanto o foco esta ativo."""

    __tablename__ = "focus"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id"))