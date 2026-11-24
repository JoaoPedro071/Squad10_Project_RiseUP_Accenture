from fastapi import APIRouter

from errors import ApiError, FieldValidationError
from models.store import store
from schemas.image import Image, ImageActiveUpdate, ImageCreate
from services.validation import validate_image

router = APIRouter(prefix="/api/images", tags=["images"])


@router.get("", response_model=list[Image])
async def list_images():
    """Catalogo completo, incluindo as inativas (o front filtra o que mostrar)."""
    return store.list_images()


@router.post("", response_model=Image, status_code=201)
async def create_image(payload: ImageCreate):
    data = payload.model_dump()
    field_errors = validate_image(data)
    if field_errors:
        raise FieldValidationError(field_errors)
    return store.create_image(data)


@router.put("/{image_id}/active", response_model=Image)
async def set_image_active(image_id: str, payload: ImageActiveUpdate):
    """Inativa ou reativa. Inativar nao apaga: a imagem some das opcoes de
    atribuicao, mas uma tela que ja a exibe continua ate ser trocada."""
    if not isinstance(payload.active, bool):
        raise ApiError(422, "Campo active inválido")
    # A imagem de stand-by nao pode sumir: troque o stand-by antes de inativar.
    if payload.active is False and store.get_settings().standby_image_id == image_id:
        raise ApiError(409, "Esta imagem é o stand-by atual. Escolha outro stand-by antes.")
    image = store.set_image_active(image_id, payload.active)
    if image is None:
        raise ApiError(404, "Imagem não encontrada")
    return image