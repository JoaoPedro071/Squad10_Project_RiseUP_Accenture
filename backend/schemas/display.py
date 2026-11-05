from typing import Annotated, Literal, Union

from pydantic import Field

from schemas.base import CamelModel
from schemas.experience import Experience


class DisplayWaiting(CamelModel):
    kind: Literal["waiting"] = "waiting"


class DisplayShowing(CamelModel):
    kind: Literal["showing"] = "showing"
    experience: Experience


class DisplayOff(CamelModel):
    kind: Literal["off"] = "off"


class DisplayError(CamelModel):
    kind: Literal["error"] = "error"


# Espelha o DisplayState de types/display.ts do front.
DisplayState = Annotated[
    Union[DisplayWaiting, DisplayShowing, DisplayOff, DisplayError],
    Field(discriminator="kind"),
]
