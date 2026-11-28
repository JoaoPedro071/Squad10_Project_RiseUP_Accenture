from fastapi import APIRouter

from dependencies import COORDINATION, LOGGED
from errors import ApiError, FieldValidationError
from models.store import store
from schemas.experience import Experience, ExperienceActiveUpdate, ExperienceCreate
from services.validation import validate_experience

router = APIRouter(prefix="/api/experiences", tags=["experiences"], dependencies=LOGGED)

NOT_FOUND = "Experiência não encontrada"


@router.get("", response_model=list[Experience])
async def list_experiences():
    """Catalogo completo, incluindo as inativas (o front filtra o que mostrar)."""
    return store.list_experiences()


@router.post("", response_model=Experience, status_code=201, dependencies=COORDINATION)
async def create_experience(payload: ExperienceCreate):
    data = payload.model_dump()
    field_errors = validate_experience(data)
    if field_errors:
        raise FieldValidationError(field_errors)
    return store.create_experience(data)


@router.put("/{experience_id}", response_model=Experience, dependencies=COORDINATION)
async def update_experience(experience_id: str, payload: ExperienceCreate):
    """Edita todos os campos (mesmas regras do cadastro). As telas que exibem
    esta experiencia passam a mostrar a versao nova."""
    if store.find_experience(experience_id) is None:
        raise ApiError(404, NOT_FOUND)
    data = payload.model_dump()
    field_errors = validate_experience(data)
    if field_errors:
        raise FieldValidationError(field_errors)
    return store.update_experience(experience_id, data)


@router.put("/{experience_id}/active", response_model=Experience, dependencies=COORDINATION)
async def set_experience_active(experience_id: str, payload: ExperienceActiveUpdate):
    """Inativa ou reativa. Inativar nao apaga: a experiencia some das opcoes de
    atribuicao, mas uma tela que ja a exibe continua ate ser trocada."""
    if not isinstance(payload.active, bool):
        raise ApiError(422, "Campo active inválido")
    experience = store.set_experience_active(experience_id, payload.active)
    if experience is None:
        raise ApiError(404, NOT_FOUND)
    return experience