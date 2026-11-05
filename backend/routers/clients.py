from fastapi import APIRouter, Response

from errors import ApiError
from models.store import store
from schemas.client import AssignmentUpdate, Client, DisplayUpdate
from schemas.display import DisplayState

router = APIRouter(prefix="/api/clients", tags=["clients"])

NO_STORE = {"Cache-Control": "no-store"}


@router.get("", response_model=list[Client])
async def list_clients():
    return store.list_clients()


@router.get("/{client_id}/display", response_model=DisplayState)
async def get_display(client_id: str, response: Response):
    """Consultado pelo client-app (player) a cada ~1,5 s."""
    state = store.get_display_state(client_id)
    if state is None:
        raise ApiError(404, "Tela não encontrada", headers=NO_STORE)
    response.headers["Cache-Control"] = "no-store"
    return state


@router.put("/{client_id}/display", response_model=Client)
async def set_display(client_id: str, payload: DisplayUpdate):
    if not isinstance(payload.display_off, bool):
        raise ApiError(422, "Campo displayOff inválido")
    client = store.update_client(client_id, display_off=payload.display_off)
    if client is None:
        raise ApiError(404, "Tela não encontrada")
    return client


@router.put("/{client_id}/assignment", response_model=Client)
async def assign_experience(client_id: str, payload: AssignmentUpdate):
    experience = store.find_experience(str(payload.experience_id or ""))
    if experience is None or not experience.active:
        raise ApiError(422, "Experiência indisponível")
    # Atribuir uma experiencia tambem religa a tela (igual ao front).
    client = store.update_client(
        client_id, current_experience_id=experience.id, display_off=False
    )
    if client is None:
        raise ApiError(404, "Tela não encontrada")
    return client
