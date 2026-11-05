from typing import Any, Literal

from schemas.base import CamelModel


class Client(CamelModel):
    id: str
    name: str
    status: Literal["online", "offline"]
    orientation: Literal["landscape", "portrait"]
    current_experience_id: str | None = None
    display_off: bool = False


class AssignmentUpdate(CamelModel):
    experience_id: Any = None


class DisplayUpdate(CamelModel):
    display_off: Any = None
