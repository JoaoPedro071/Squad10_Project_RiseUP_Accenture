"""Tempo real: conexoes WebSocket com as telas (player) e com o dashboard.

Mensagens (JSON em camelCase):
- servidor -> tela:      {"type": "display", "version": n, "state": DisplayState}
- tela -> servidor:      {"type": "heartbeat", ...} e {"type": "ack", "version": n}
- servidor -> dashboard: {"type": "ack", "clientId": ..., "version": n}
- identificacao:         {"type": "identify", ...} para telas e dashboard
- servidor -> dashboard: {"type": "state", "focus": ..., "clients": [...]}

Rode com UM worker: as conexoes ficam na memoria deste processo.
"""

import asyncio
import json
import logging

from fastapi import WebSocket
from pydantic import TypeAdapter

from models.store import store
from schemas.display import DisplayState

logger = logging.getLogger(__name__)
_display_json = TypeAdapter(DisplayState)

IDENTIFY_SECONDS = 10


class Hub:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        # id da tela -> conexoes abertas (a mesma tela pode estar em 2 abas)
        self.players: dict[str, set[WebSocket]] = {}
        self.dashboards: set[WebSocket] = set()
        self._last_display: dict[str, str] = {}  # ultimo estado enviado a cada tela
        self._version: dict[str, int] = {}  # numero da ultima mudanca enviada
        self._last_board: str | None = None

    # --- conexoes ---
    async def add_player(self, client_id: str, websocket: WebSocket) -> None:
        self.players.setdefault(client_id, set()).add(websocket)
        await self._send_display(client_id, force=True)

    def remove_player(self, client_id: str, websocket: WebSocket) -> None:
        sockets = self.players.get(client_id)
        if sockets is None:
            return
        sockets.discard(websocket)
        if not sockets:
            del self.players[client_id]
            self._last_display.pop(client_id, None)

    async def add_dashboard(self, websocket: WebSocket) -> None:
        self.dashboards.add(websocket)
        await self._send({websocket}, self._board_message())

    def remove_dashboard(self, websocket: WebSocket) -> None:
        self.dashboards.discard(websocket)

    # --- envio ---
    async def _send(self, sockets, message: dict) -> None:
        for websocket in list(sockets):
            try:
                await websocket.send_json(message)
            except Exception:  # conexao caindo: quem a recebe faz a limpeza
                logger.debug("Falha ao enviar mensagem", exc_info=True)

    async def _send_display(self, client_id: str, force: bool = False) -> None:
        """Envia o que a tela deve exibir. Sem force, so envia se mudou."""
        state = store.get_display_state(client_id)
        if state is None:
            return
        data = _display_json.dump_python(state, mode="json", by_alias=True)
        key = json.dumps(data, sort_keys=True)
        if not force and self._last_display.get(client_id) == key:
            return
        self._last_display[client_id] = key
        version = self._version.get(client_id, 0) + 1
        self._version[client_id] = version
        await self._send(
            self.players.get(client_id, set()),
            {"type": "display", "version": version, "state": data},
        )

    def _board_message(self) -> dict:
        focus = store.get_focus()
        return {
            "type": "state",
            "focus": focus.model_dump(mode="json", by_alias=True) if focus else None,
            "clients": [
                client.model_dump(mode="json", by_alias=True)
                for client in store.list_clients()
            ],
        }

    async def _send_board(self, only_if_changed: bool = False) -> None:
        message = self._board_message()
        # lastSeenAt muda a cada sinal de vida; nao conta como mudanca.
        key = json.dumps(
            [message["focus"]]
            + [{k: v for k, v in c.items() if k != "lastSeenAt"} for c in message["clients"]],
            sort_keys=True,
        )
        if only_if_changed and key == self._last_board:
            return
        self._last_board = key
        await self._send(self.dashboards, message)

    async def refresh(
        self, force_client: str | None = None, board_only_if_changed: bool = False
    ) -> None:
        """Chamado depois de qualquer alteracao: envia o novo conteudo as telas
        que mudaram (e sempre a force_client) e o estado ao dashboard."""
        for client_id in list(self.players):
            await self._send_display(client_id, force=client_id == force_client)
        await self._send_board(only_if_changed=board_only_if_changed)

    # --- sinal de vida ---
    async def heartbeat(self, client_id: str, orientation: str, resolution: str | None) -> None:
        """Sinal de vida recebido pelo WebSocket (mesmo efeito do POST /heartbeat)."""
        store.record_heartbeat(client_id, orientation, resolution)
        await self.refresh(board_only_if_changed=True)

    async def tick(self) -> None:
        """Roda a cada poucos segundos: avisa o dashboard quando uma tela passa
        do tempo limite sem sinal de vida (vira Desligada)."""
        await self._send_board(only_if_changed=True)


    # --- confirmacao de recebimento (US-12) ---
    async def ack(self, client_id: str, version: int) -> None:
        """A tela confirmou que exibiu a mudanca. Avisos antigos sao ignorados."""
        if version != self._version.get(client_id):
            return
        await self._send(
            self.dashboards, {"type": "ack", "clientId": client_id, "version": version}
        )

    # --- modo de identificacao ---
    async def identify(self) -> dict[str, int]:
        """Cada tela conectada mostra seu numero e nome por alguns segundos.
        O numero segue a ordem das telas (o mesmo para telas e dashboard)."""
        clients = store.list_clients()
        numbers = {client.id: index + 1 for index, client in enumerate(clients)}
        for client in clients:
            await self._send(
                self.players.get(client.id, set()),
                {
                    "type": "identify",
                    "number": numbers[client.id],
                    "name": client.name,
                    "seconds": IDENTIFY_SECONDS,
                },
            )
        await self._send(
            self.dashboards,
            {"type": "identify", "numbers": numbers, "seconds": IDENTIFY_SECONDS},
        )
        return numbers


hub = Hub()

TICK_SECONDS = 2


async def run_ticker() -> None:
    """Laco em segundo plano iniciado junto com a API (main.py)."""
    while True:
        await asyncio.sleep(TICK_SECONDS)
        try:
            await hub.tick()
        except Exception:
            logger.exception("Falha na checagem periodica das telas")