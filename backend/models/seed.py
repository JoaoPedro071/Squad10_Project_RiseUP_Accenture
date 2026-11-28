"""Dados iniciais (catalogo de experiencias, imagens e telas)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from db.tables import ClientRow, ExperienceRow, ImageRow, SettingsRow
from schemas.client import Client
from schemas.experience import Experience
from schemas.image import Image


def seed_experiences() -> list[Experience]:
    return [
        Experience(id="exp-1", title="Cibersegurança",
                   description="Demonstração de detecção de ameaças em tempo real.",
                   url="/demo?tema=ciberseguranca", type="web",
                   orientation="landscape", active=True),
        Experience(id="exp-2", title="Inteligência Artificial",
                   description="Painel interativo sobre aplicações de IA generativa.",
                   url="/demo?tema=ia", type="web", orientation="any",
                   active=True),
        Experience(id="exp-3", title="Logística Inteligente",
                   description="Mapa de rotas e previsão de demanda.",
                   url="/demo?tema=logistica", type="web",
                   orientation="landscape", active=True),
        # exp-4 (Cartaz Institucional) virou a imagem img-1.
        Experience(id="exp-5", title="Computação Quântica (antiga)",
                   description="Experiência desativada, mantida só no catálogo.",
                   url="/demo?tema=quantica", type="web", orientation="any",
                   active=False),
    ]


def seed_images() -> list[Image]:
    return [
        Image(id="img-1", title="Cartaz Institucional",
              description="Imagem em retrato com a apresentação do Innovation Center.",
              url="/demo-image.svg", orientation="portrait", active=True),
    ]


# Telas que "acabaram de dar sinal" quando o servidor sobe. Sem o player
# rodando, elas ficam desligadas apos o tempo limite do sinal de vida.
ONLINE_AT_START = {"cli-1", "cli-2", "cli-3"}


def seed_clients() -> list[Client]:
    return [
        Client(id="cli-1", name="Monitor Entrada",
               current_experience_id="exp-1",
               reported_orientation="landscape", reported_resolution="1920x1080",
               x=25, y=30, locked=True),
        # Ligada e sem conteudo: exibe o stand-by.
        Client(id="cli-2", name="TV Sala de Reunião",
               reported_orientation="landscape", reported_resolution="3840x2160",
               x=75, y=30, locked=True),
        Client(id="cli-3", name="Tablet Recepção",
               img_id="img-1", display_img=True,
               reported_orientation="portrait", reported_resolution="1080x1920",
               x=25, y=72),
        # Nunca enviou sinal de vida: comeca desligada e sem orientacao.
        Client(id="cli-4", name="Monitor Touch Central",
               x=75, y=72),
    ]


def seed_database(session: Session) -> bool:
    """Grava os dados iniciais, mas so se o banco estiver vazio.

    Devolve True se gravou. Assim, reiniciar a API nao apaga nada.
    """
    if session.scalar(select(ClientRow.pk).limit(1)) is not None:
        return False

    for experience in seed_experiences():
        session.add(ExperienceRow(**experience.model_dump()))
    for image in seed_images():
        session.add(ImageRow(**image.model_dump()))
    # Grava o catalogo antes das telas, que apontam para ele.
    session.flush()

    for client in seed_clients():
        session.add(
            ClientRow(
                id=client.id,
                name=client.name,
                current_experience_id=client.current_experience_id,
                img_id=client.img_id,
                display_img=client.display_img,
                x=client.x,
                y=client.y,
                locked=client.locked,
            )
        )
    session.add(SettingsRow(id=1))  # stand-by comeca sem imagem (tela preta)
    session.commit()
    return True