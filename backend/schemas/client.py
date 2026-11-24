from datetime import datetime
from typing import Any, Literal

from schemas.base import CamelModel

ScreenOrientation = Literal["landscape", "portrait"]


class Client(CamelModel):
    id: str
    name: str
    # Provisorio: vira status derivado (5 estados) na Etapa 6.
    status: Literal["online", "offline"]

    # --- o que a tela deve exibir ---
    current_experience_id: str | None = None
    img_id: str | None = None
    display_img: bool = False  # true = exibe a imagem (img_id) no lugar da experiencia
    # Provisorio: sai na Etapa 8, quando o Modo foco vira uma camada.
    display_off: bool = False

    # --- informado pela propria tela (sinal de vida, Etapa 5) ---
    reported_orientation: ScreenOrientation | None = None
    reported_resolution: str | None = None  # ex.: "1920x1080"
    last_seen_at: datetime | None = None

    # --- planta ---
    x: float  # posição na planta, em % da largura (0 a 100)
    y: float  # posição na planta, em % da altura (0 a 100)
    locked: bool = False  # true = posição travada


class ContentUpdate(CamelModel):
    """Corpo do PUT /api/clients/{id}/content.

    Todos os campos sao opcionais e so os ENVIADOS mudam. Enviar null remove.
    """

    experience_id: Any = None
    img_id: Any = None
    display_img: Any = None


class DisplayUpdate(CamelModel):
    display_off: Any = None


class PositionUpdate(CamelModel):
    x: Any = None
    y: Any = None


class LockUpdate(CamelModel):
    locked: Any = None