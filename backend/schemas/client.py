from datetime import datetime
from typing import Any, Literal

from schemas.base import CamelModel

ScreenOrientation = Literal["landscape", "portrait"]


# Estados da tela (calculados pelo backend, nunca enviados pelo front):
#   busy     Em uso     exibe uma experiencia ou imagem
#   standby  Stand-by   conectada, sem conteudo atribuido
#   paused   Em pausa   escurecida pelo Modo foco
#   error    Erro       orientacao da tela nao combina com o conteudo
#   off      Desligada  sem sinal de vida
ScreenStatus = Literal["busy", "standby", "paused", "error", "off"]

class Client(CamelModel):
    id: str
    name: str

    # Calculados pelo backend a cada consulta (ver ScreenStatus acima).
    status: ScreenStatus = "off"
    # true = a orientacao da tela nao combina com o que ela esta exibindo
    # (o "icone de erro de configuracao" pedido pelo Bruno).
    orientation_mismatch: bool = False

    # --- o que a tela deve exibir ---
    current_experience_id: str | None = None
    img_id: str | None = None
    display_img: bool = False  # true = exibe a imagem (img_id) no lugar da experiencia

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


class HeartbeatUpdate(CamelModel):
    """Corpo do POST /api/clients/{id}/heartbeat, enviado pela propria tela."""

    orientation: Any = None
    resolution: Any = None  # opcional, ex.: "1920x1080"


class PositionUpdate(CamelModel):
    x: Any = None
    y: Any = None


class LockUpdate(CamelModel):
    locked: Any = None