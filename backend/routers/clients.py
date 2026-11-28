import math
import re

from fastapi import APIRouter, Response

from dependencies import COORDINATION, LOGGED
from errors import ApiError, FieldValidationError
from models.store import store
from schemas.client import (
    Client,
    ClientCreate,
    ContentUpdate,
    HeartbeatUpdate,
    LockUpdate,
    PositionUpdate,
)
from schemas.display import DisplayState
from services.realtime import IDENTIFY_SECONDS, hub
from services.validation import validate_client

router = APIRouter(prefix="/api/clients", tags=["clients"])

NOT_FOUND = "Tela não encontrada"
NO_STORE = {"Cache-Control": "no-store"}
RESOLUTION = re.compile(r"^\d{2,5}x\d{2,5}$")  # ex.: 1920x1080


def _is_percent(value: object) -> bool:
    # bool e subclasse de int em Python, entao precisa ser excluido de proposito.
    return (
        isinstance(value, (int, float))
        and not isinstance(value, bool)
        and math.isfinite(value)
        and 0 <= value <= 100
    )


@router.get("", response_model=list[Client], dependencies=LOGGED)
async def list_clients():
    return store.list_clients()


@router.post("", response_model=Client, status_code=201, dependencies=COORDINATION)
async def create_client(payload: ClientCreate):
    """Cadastra uma tela: nasce no centro da planta, destravada e sem conteudo."""
    data = payload.model_dump()
    field_errors = validate_client(data)
    if field_errors:
        raise FieldValidationError(field_errors)
    return store.create_client(str(data["name"]))


@router.post("/identify", dependencies=LOGGED)
async def identify_screens():
    """Modo de identificacao: cada tela conectada mostra numero e nome
    por alguns segundos. Devolve o numero de cada tela."""
    numbers = await hub.identify()
    return {"seconds": IDENTIFY_SECONDS, "numbers": numbers}


@router.get("/{client_id}/display", response_model=DisplayState)
async def get_display(client_id: str, response: Response):
    """Consultado pelo client-app (player) a cada ~1,5 s."""
    state = store.get_display_state(client_id)
    if state is None:
        raise ApiError(404, "Tela não encontrada", headers=NO_STORE)
    response.headers["Cache-Control"] = "no-store"
    return state


@router.post("/{client_id}/heartbeat", status_code=204)
async def heartbeat(client_id: str, payload: HeartbeatUpdate):
    """Sinal de vida enviado pela propria tela a cada ~5 s.

    Informa a orientacao atual da maquina (obrigatoria) e a resolucao
    (opcional). Quem para de enviar passa a ser considerada desligada.
    """
    if payload.orientation not in ("landscape", "portrait"):
        raise ApiError(422, "Orientação inválida")
    resolution = payload.resolution
    if resolution is not None and (
        not isinstance(resolution, str) or not RESOLUTION.match(resolution)
    ):
        raise ApiError(422, "Resolução inválida")
    if store.record_heartbeat(client_id, payload.orientation, resolution) is None:
        raise ApiError(404, "Tela não encontrada")
    return Response(status_code=204)


@router.put("/{client_id}/content", response_model=Client, dependencies=LOGGED)
async def set_content(client_id: str, payload: ContentUpdate):
    """Define o que a tela exibe: experiencia, imagem ou nada.

    So os campos enviados mudam. Regras:
    - experienceId (id ou null): escolher uma experiencia passa a exibi-la.
    - imgId (id ou null): escolher uma imagem passa a exibi-la; remover a
      imagem volta para a experiencia (ou stand-by).
    - displayImg (true/false): alterna entre a imagem e a experiencia sem
      perder nenhuma das duas.
    Tudo e validado antes de gravar: ou muda tudo, ou nada muda.
    """
    sent = payload.model_fields_set
    if not sent:
        raise ApiError(422, "Nada para alterar")
    client = store.find_client(client_id)
    if client is None:
        raise ApiError(404, "Tela não encontrada")

    # Parte do que a tela tem hoje e aplica so o que foi enviado.
    experience_id = client.current_experience_id
    img_id = client.img_id
    display_img = client.display_img

    if "experience_id" in sent:
        experience_id = payload.experience_id
        if experience_id is not None:
            experience = (
                store.find_experience(experience_id)
                if isinstance(experience_id, str)
                else None
            )
            if experience is None or not experience.active:
                raise ApiError(422, "Experiência indisponível")
            display_img = False

    if "img_id" in sent:
        img_id = payload.img_id
        if img_id is not None:
            image = store.find_image(img_id) if isinstance(img_id, str) else None
            if image is None or not image.active:
                raise ApiError(422, "Imagem indisponível")
            display_img = True
        else:
            display_img = False

    if "display_img" in sent:
        if not isinstance(payload.display_img, bool):
            raise ApiError(422, "Campo displayImg inválido")
        display_img = payload.display_img

    if display_img and img_id is None:
        raise ApiError(422, "Escolha uma imagem antes de exibi-la")

    return store.set_content(
        client_id,
        current_experience_id=experience_id,
        img_id=img_id,
        display_img=display_img,
    )


@router.put("/{client_id}/position", response_model=Client, dependencies=COORDINATION)
async def move_client(client_id: str, payload: PositionUpdate):
    if not _is_percent(payload.x) or not _is_percent(payload.y):
        raise ApiError(422, "Posição inválida")
    current = store.find_client(client_id)
    if current is None:
        raise ApiError(404, "Tela não encontrada")
    if current.locked:
        raise ApiError(403, "Esta tela está travada")
    return store.update_client(client_id, x=payload.x, y=payload.y)


@router.put("/{client_id}/lock", response_model=Client, dependencies=COORDINATION)
async def lock_client(client_id: str, payload: LockUpdate):
    if not isinstance(payload.locked, bool):
        raise ApiError(422, "Campo locked inválido")
    client = store.update_client(client_id, locked=payload.locked)
    if client is None:
        raise ApiError(404, "Tela não encontrada")
    return client


# Rotas com so o id (sem /content, /position...) ficam por ultimo. Elas nao
# conflitam com as de cima (tem um pedaco a menos no caminho), mas assim a
# leitura fica na ordem: especificas primeiro.
@router.put("/{client_id}", response_model=Client, dependencies=COORDINATION)
async def rename_client(client_id: str, payload: ClientCreate):
    if store.find_client(client_id) is None:
        raise ApiError(404, NOT_FOUND)
    data = payload.model_dump()
    field_errors = validate_client(data, ignore_id=client_id)
    if field_errors:
        raise FieldValidationError(field_errors)
    return store.rename_client(client_id, str(data["name"]))


@router.delete("/{client_id}", status_code=204, dependencies=COORDINATION)
async def delete_client(client_id: str):
    """Remove a tela. O player dela, se conectado, e avisado (4404)."""
    if store.find_client(client_id) is None:
        raise ApiError(404, NOT_FOUND)
    focus = store.get_focus()
    if focus is not None and focus.client_id == client_id:
        raise ApiError(
            409, "Esta tela está no Modo foco. Saia do Modo foco antes de removê-la."
        )
    store.delete_client(client_id)
    await hub.close_player(client_id)
    return Response(status_code=204)