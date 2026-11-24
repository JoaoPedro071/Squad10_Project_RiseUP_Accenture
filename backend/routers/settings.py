from fastapi import APIRouter

from errors import ApiError
from models.store import store
from schemas.settings import Settings, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=Settings)
async def get_settings():
    return store.get_settings()


@router.put("", response_model=Settings)
async def update_settings(payload: SettingsUpdate):
    """Escolhe a imagem de stand-by. null remove (as telas sem conteudo ficam pretas)."""
    image_id = payload.standby_image_id
    if image_id is not None:
        image = store.find_image(image_id) if isinstance(image_id, str) else None
        if image is None or not image.active:
            raise ApiError(422, "Imagem indisponível")
    return store.set_standby_image(image_id)