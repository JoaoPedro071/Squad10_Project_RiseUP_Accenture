from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base de todos os schemas: Python em snake_case, JSON em camelCase.

    O front (Next.js) usa currentExperienceId, displayOff, experienceId...
    """

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
