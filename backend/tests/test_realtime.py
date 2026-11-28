"""Tempo real (WebSocket): telas e dashboard recebem o estado sem consultar."""
from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from main import app
from models.store import store
from services.auth import hash_password, new_token, token_hash
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


# ---------- avisos a cada alteracao ----------

def test_content_change_reaches_screen_and_dashboard(tc):
    with tc.websocket_connect("/ws/player/cli-2") as player, \
            tc.websocket_connect("/ws/dashboard") as board:
        assert player.receive_json()["state"]["kind"] == "standby"
        board.receive_json()
        tc.put("/api/clients/cli-2/content", json={"experienceId": "exp-3"})
        message = player.receive_json()
        assert message["version"] == 2
        assert message["state"]["experience"]["id"] == "exp-3"
        cli2 = next(c for c in board.receive_json()["clients"] if c["id"] == "cli-2")
        assert cli2["currentExperienceId"] == "exp-3"


def test_change_is_only_sent_to_affected_screen(tc):
    with tc.websocket_connect("/ws/player/cli-1") as cli1, \
            tc.websocket_connect("/ws/player/cli-2") as cli2:
        cli1.receive_json()
        cli2.receive_json()
        tc.put("/api/clients/cli-2/content", json={"experienceId": "exp-3"})
        assert cli2.receive_json()["state"]["experience"]["id"] == "exp-3"
        # A proxima mensagem da cli-1 e a da propria troca (nada antes dela).
        tc.put("/api/clients/cli-1/content", json={"experienceId": "exp-2"})
        message = cli1.receive_json()
        assert message["version"] == 2
        assert message["state"]["experience"]["id"] == "exp-2"


def test_focus_pauses_other_screens(tc):
    with tc.websocket_connect("/ws/player/cli-2") as cli2:
        cli2.receive_json()
        tc.post("/api/focus", json={"clientId": "cli-1"})
        assert cli2.receive_json()["state"]["kind"] == "paused"
        tc.delete("/api/focus")
        assert cli2.receive_json()["state"]["kind"] == "standby"


def test_failed_change_sends_nothing(tc):
    with tc.websocket_connect("/ws/player/cli-2") as cli2:
        cli2.receive_json()
        r = tc.put("/api/clients/cli-2/content", json={"experienceId": "xxx"})
        assert r.status_code == 422
        tc.put("/api/clients/cli-2/content", json={"experienceId": "exp-3"})
        assert cli2.receive_json()["version"] == 2  # so a troca valida chegou


# ---------- sinal de vida pelo WebSocket ----------

def test_heartbeat_over_websocket_turns_screen_on(tc):
    with tc.websocket_connect("/ws/dashboard") as board, \
            tc.websocket_connect("/ws/player/cli-4") as player:
        board.receive_json()
        player.receive_json()
        player.send_json({"type": "heartbeat", "orientation": "portrait",
                          "resolution": "1080x1920"})
        cli4 = next(c for c in board.receive_json()["clients"] if c["id"] == "cli-4")
        assert cli4["status"] == "standby"
        assert cli4["reportedOrientation"] == "portrait"
        assert cli4["reportedResolution"] == "1080x1920"


def test_tick_tells_dashboard_when_screen_goes_off(tc):
    with tc.websocket_connect("/ws/dashboard") as board:
        board.receive_json()
        now = store._clock()
        store._clock = lambda: now + timedelta(seconds=16)  # passou do limite
        tc.portal.call(hub.tick)
        statuses = {c["id"]: c["status"] for c in board.receive_json()["clients"]}
        assert statuses["cli-1"] == "off"


def test_tick_closes_dashboard_when_session_expires(tc):
    user = store.create_user("ana@exemplo.com", "Ana", hash_password("senha-forte-123"),
                             "coordination")
    token = new_token()
    store.create_session(user.id, token_hash(token))
    with tc.websocket_connect("/ws/dashboard", headers={"cookie": f"em_session={token}"}) as board:
        board.receive_json()
        now = store._clock()
        store._clock = lambda: now + timedelta(hours=13)  # passou das 12 h
        tc.portal.call(hub.tick)
        with pytest.raises(WebSocketDisconnect) as closed:
            board.receive_json()
        assert closed.value.code == 4401


def test_tick_keeps_dashboard_without_cookie(tc):
    # Conexao sem cookie (usuario falso dos testes): nao e derrubada.
    with tc.websocket_connect("/ws/dashboard") as board:
        board.receive_json()
        tc.portal.call(hub.tick)
        assert len(hub.dashboards) == 1


# ---------- confirmacao de recebimento ----------

def test_screen_ack_reaches_dashboard(tc):
    with tc.websocket_connect("/ws/player/cli-2") as player, \
            tc.websocket_connect("/ws/dashboard") as board:
        player.receive_json()
        board.receive_json()
        tc.put("/api/clients/cli-2/content", json={"experienceId": "exp-3"})
        version = player.receive_json()["version"]
        board.receive_json()  # estado novo
        player.send_json({"type": "ack", "version": version})
        assert board.receive_json() == {"type": "ack", "clientId": "cli-2", "version": version}


def test_old_ack_is_ignored(tc):
    with tc.websocket_connect("/ws/player/cli-2") as player, \
            tc.websocket_connect("/ws/dashboard") as board:
        player.receive_json()
        board.receive_json()
        tc.put("/api/clients/cli-2/content", json={"experienceId": "exp-3"})
        version = player.receive_json()["version"]
        board.receive_json()
        player.send_json({"type": "ack", "version": version - 1})  # antigo
        player.send_json({"type": "ack", "version": version})
        assert board.receive_json()["version"] == version


# ---------- modo de identificacao ----------

def test_identify_reaches_screens_and_dashboard(tc):
    with tc.websocket_connect("/ws/player/cli-3") as player, \
            tc.websocket_connect("/ws/dashboard") as board:
        player.receive_json()
        board.receive_json()
        r = tc.post("/api/clients/identify")
        assert r.status_code == 200
        assert r.json() == {
            "seconds": 10,
            "numbers": {"cli-1": 1, "cli-2": 2, "cli-3": 3, "cli-4": 4},
        }
        assert player.receive_json() == {
            "type": "identify", "number": 3, "name": "Tablet Recepção", "seconds": 10,
        }
        assert board.receive_json()["type"] == "identify"