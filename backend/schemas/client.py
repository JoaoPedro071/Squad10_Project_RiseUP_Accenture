from typing import Any, Literal

from schemas.base import CamelModel


class Client(CamelModel):
    id: str
    name: str
    room: str
    status: Literal["online", "offline"]
    orientation: Literal["landscape", "portrait"]
    current_experience_id: str | None = None
    display_off: bool = False
    x: float  # posição na planta, em % da largura (0 a 100)
    y: float  # posição na planta, em % da altura (0 a 100)
    locked: bool = False  # true = posição travada


class AssignmentUpdate(CamelModel):
    experience_id: Any = None


class DisplayUpdate(CamelModel):
    display_off: Any = None


class PositionUpdate(CamelModel):
    x: Any = None
    y: Any = None


class LockUpdate(CamelModel):
    locked: Any = None
