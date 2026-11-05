"""Dados iniciais. Copia de dashboard/lib/mock-data.ts (feature/front-skeleton)."""

from schemas.client import Client
from schemas.experience import Experience


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
        Experience(id="exp-4", title="Cartaz Institucional",
                   description="Imagem em retrato com a apresentação do Innovation Center.",
                   url="/demo-image.svg", type="image",
                   orientation="portrait", active=True),
        Experience(id="exp-5", title="Computação Quântica (antiga)",
                   description="Experiência desativada, mantida só no catálogo.",
                   url="/demo?tema=quantica", type="web", orientation="any",
                   active=False),
    ]


def seed_clients() -> list[Client]:
    return [
        Client(id="cli-1", name="Monitor Entrada", room="Recepção",
               status="online", orientation="landscape",
               current_experience_id="exp-1", display_off=False,
               x=25, y=30, locked=True),
        Client(id="cli-2", name="TV Sala de Reunião", room="Sala de Reunião",
               status="online", orientation="landscape",
               current_experience_id=None, display_off=True,
               x=75, y=30, locked=True),
        Client(id="cli-3", name="Tablet Recepção", room="Recepção",
               status="online", orientation="portrait",
               current_experience_id="exp-4", display_off=False,
               x=25, y=72, locked=False),
        Client(id="cli-4", name="Monitor Touch Central", room="Sala Central",
               status="offline", orientation="landscape",
               current_experience_id=None, display_off=False,
               x=75, y=72, locked=False),
    ]
