"""Dados iniciais (catalogo de experiencias, imagens e telas)."""

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
                   url="/demo?tema=ia", type="web", orientation="any", active=True),
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


def seed_clients() -> list[Client]:
    return [
        Client(id="cli-1", name="Monitor Entrada", status="online",
               current_experience_id="exp-1",
               reported_orientation="landscape", reported_resolution="1920x1080",
               x=25, y=30, locked=True),
        Client(id="cli-2", name="TV Sala de Reunião", status="online",
               display_off=True,
               reported_orientation="landscape", reported_resolution="3840x2160",
               x=75, y=30, locked=True),
        Client(id="cli-3", name="Tablet Recepção", status="online",
               img_id="img-1", display_img=True,
               reported_orientation="portrait", reported_resolution="1080x1920",
               x=25, y=72),
        # Offline: nunca enviou sinal de vida, entao nao informou orientacao.
        Client(id="cli-4", name="Monitor Touch Central", status="offline",
               x=75, y=72),
    ]