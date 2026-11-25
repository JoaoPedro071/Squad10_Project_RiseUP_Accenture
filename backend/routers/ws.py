"""Rotas WebSocket: tela (player) e dashboard."""

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from config import CORS_ORIGINS
from models.store import store
from services.realtime import hub

router = APIRouter()


def _allowed_origin(websocket: WebSocket) -> bool:
    """O navegador nao aplica CORS a WebSocket: conferimos a origem aqui.
    Sem cabecalho Origin (fora do navegador, ex.: testes) e aceito."""
    origin = websocket.headers.get("origin")
    return origin is None or "*" in CORS_ORIGINS or origin in CORS_ORIGINS


async def _messages(websocket: WebSocket):
    """Mensagens recebidas, ja convertidas de JSON. Ignora o que nao for JSON."""
    while True:
        text = await websocket.receive_text()
        try:
            message = json.loads(text)
        except ValueError:
            continue
        if isinstance(message, dict):
            yield message


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
        async for _message in _messages(websocket):
            pass  # sinal de vida e confirmacao chegam nas proximas etapas
    except WebSocketDisconnect:
        pass
    finally:
        hub.remove_player(client_id, websocket)


@router.websocket("/ws/dashboard")
async def dashboard_socket(websocket: WebSocket):
    await websocket.accept()
    if not _allowed_origin(websocket):
        await websocket.close(code=4403, reason="Origem não permitida")
        return
    await hub.add_dashboard(websocket)
    try:
        async for _message in _messages(websocket):
            pass  # o dashboard so recebe
    except WebSocketDisconnect:
        pass
    finally:
        hub.remove_dashboard(websocket)