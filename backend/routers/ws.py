"""Rotas WebSocket: tela (player) e dashboard."""

import json
from typing import Annotated

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

from config import CORS_ORIGINS
from dependencies import SESSION_COOKIE, socket_user
from models.store import store
from routers.clients import RESOLUTION
from schemas.user import User
from services.auth import token_hash
from services.realtime import hub

router = APIRouter()


def _allowed_origin(websocket: WebSocket) -> bool:
    """O navegador nao aplica CORS a WebSocket: conferimos a origem aqui.
    Sem cabecalho Origin (fora do navegador, ex.: testes) e aceito."""
    origin = websocket.headers.get("origin")
    return origin is None or "*" in CORS_ORIGINS or origin in CORS_ORIGINS


async def _messages(websocket: WebSocket):
    """Mensagens recebidas, ja convertidas de JSON. Ignora o que nao for JSON."""
    # Para quando o servidor fecha a conexao (ex.: fim da sessao do dashboard).
    while websocket.application_state == WebSocketState.CONNECTED:
        text = await websocket.receive_text()
        try:
            message = json.loads(text)
        except ValueError:
            continue
        if isinstance(message, dict):
            yield message


async def _heartbeat(client_id: str, message: dict) -> None:
    """{"type": "heartbeat", "orientation": "landscape", "resolution": "1920x1080"}
    Mensagem com dados invalidos e ignorada."""
    orientation = message.get("orientation")
    if orientation not in ("landscape", "portrait"):
        return
    resolution = message.get("resolution")
    if not isinstance(resolution, str) or not RESOLUTION.match(resolution):
        resolution = None
    await hub.heartbeat(client_id, orientation, resolution)


@router.websocket("/ws/player/{client_id}")
async def player_socket(websocket: WebSocket, client_id: str):
    await websocket.accept()
    if not _allowed_origin(websocket):
        await websocket.close(code=4403, reason="Origem não permitida")
        return
    if store.find_client(client_id) is None:
        await websocket.close(code=4404, reason="Tela não cadastrada")
        return
    await hub.add_player(client_id, websocket)
    try:
        async for message in _messages(websocket):
            if message.get("type") == "heartbeat":
                await _heartbeat(client_id, message)
            elif message.get("type") == "ack" and isinstance(message.get("version"), int):
                await hub.ack(client_id, message["version"])
    except WebSocketDisconnect:
        pass
    finally:
        hub.remove_player(client_id, websocket)


@router.websocket("/ws/dashboard")
async def dashboard_socket(
    websocket: WebSocket, user: Annotated[User | None, Depends(socket_user)]
):
    await websocket.accept()
    if not _allowed_origin(websocket):
        await websocket.close(code=4403, reason="Origem não permitida")
        return
    if user is None:
        await websocket.close(code=4401, reason="Faça login para continuar")
        return
    # Guarda a sessao da conexao: o logout e a expiracao fecham esta aba.
    token = websocket.cookies.get(SESSION_COOKIE)
    await hub.add_dashboard(websocket, token_hash(token) if token else None)
    try:
        async for _message in _messages(websocket):
            pass  # o dashboard so recebe
    except WebSocketDisconnect:
        pass
    finally:
        hub.remove_dashboard(websocket)