from fastapi import APIRouter

from errors import FieldValidationError
from models.store import store
from schemas.experience import Experience, ExperienceCreate
from services.validation import validate_experience

router = APIRouter(prefix="/api/experiences", tags=["experiences"])


@router.get("", response_model=list[Experience])
async def list_experiences():
    return store.list_experiences()


@router.post("", response_model=Experience, status_code=201)
async def create_experience(payload: ExperienceCreate):
    data = payload.model_dump()
    field_errors = validate_experience(data)
    if field_errors:
        raise FieldValidationError(field_errors)
    return store.create_experience(data)
