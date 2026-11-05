from fastapi import APIRouter

from errors import ApiError
from models.store import store
from schemas.focus import FocusResponse, FocusStart

router = APIRouter(prefix="/api/focus", tags=["focus"])

# codigo interno -> (mensagem, status), igual ao front
FOCUS_ERRORS = {
    "not_found": ("Tela não encontrada", 404),
    "offline": ("A tela está offline", 422),
    "already_active": ("O Modo foco já está ativo", 409),
}


def _state() -> dict:
    return {"focus": store.get_focus(), "clients": store.list_clients()}


@router.get("", response_model=FocusResponse)
async def get_state():
    """Estado completo (telas + modo foco), usado na atualizacao periodica da planta."""
    return _state()


@router.post("", response_model=FocusResponse, status_code=201)
async def start_focus(payload: FocusStart):
    result = store.start_focus(str(payload.client_id or ""))
    if isinstance(result, str):
        message, status = FOCUS_ERRORS[result]
        raise ApiError(status, message)
    return _state()


@router.delete("", response_model=FocusResponse)
async def end_focus():
    store.end_focus()
    return _state()
