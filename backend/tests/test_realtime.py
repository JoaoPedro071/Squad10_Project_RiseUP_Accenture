"""Tempo real (WebSocket): telas e dashboard recebem o estado sem consultar."""

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from main import app
from models.store import store
from services.realtime import hub


@pytest.fixture
def tc():
    store.reset()
    hub.reset()
    with TestClient(app) as client:
        yield client


def test_player_receives_display_on_connect(tc):
    with tc.websocket_connect("/ws/player/cli-1") as ws:
        message = ws.receive_json()
        assert message["type"] == "display" and message["version"] == 1
        assert message["state"]["kind"] == "experience"
        assert message["state"]["experience"]["id"] == "exp-1"


def test_player_unknown_screen_is_closed(tc):
    with pytest.raises(WebSocketDisconnect) as closed:
        with tc.websocket_connect("/ws/player/xxx") as ws:
            ws.receive_json()
    assert closed.value.code == 4404


def test_dashboard_receives_state_on_connect(tc):
    with tc.websocket_connect("/ws/dashboard") as ws:
        message = ws.receive_json()
        assert message["type"] == "state" and message["focus"] is None
        assert [c["id"] for c in message["clients"]] == ["cli-1", "cli-2", "cli-3", "cli-4"]
        assert "currentExperienceId" in message["clients"][0]


def test_socket_from_unknown_origin_is_refused(tc):
    with pytest.raises(WebSocketDisconnect) as closed:
        with tc.websocket_connect(
            "/ws/dashboard", headers={"origin": "https://site-estranho.com"}
        ) as ws:
            ws.receive_json()
    assert closed.value.code == 4403


def test_socket_from_dashboard_origin_is_accepted(tc):
    with tc.websocket_connect(
        "/ws/dashboard", headers={"origin": "http://localhost:3000"}
    ) as ws:
        assert ws.receive_json()["type"] == "state"