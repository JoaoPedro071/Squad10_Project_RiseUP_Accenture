"""Login do dashboard: senhas, usuarios e sessoes."""

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from starlette.websockets import WebSocketDisconnect

from db.tables import SessionRow
from main import app
from models.store import store
from services.auth import (
    hash_password,
    login_limiter,
    new_token,
    token_hash,
    validate_new_user,
    verify_password,
)


@pytest.fixture(autouse=True)
def fresh_store():
    store.reset()
    # Aqui o login e testado de verdade: desliga o usuario falso do conftest.py.
    app.dependency_overrides.clear()


def test_password_is_hashed_and_verified():
    hashed = hash_password("senha-forte-123")
    assert "senha-forte-123" not in hashed
    assert verify_password(hashed, "senha-forte-123") is True
    assert verify_password(hashed, "outra-senha") is False
    assert verify_password(None, "qualquer") is False  # usuario inexistente


def test_new_user_rules():
    assert validate_new_user("ana@exemplo.com", "Ana", "12345678", "coordination") == []
    problems = validate_new_user("ana", " ", "123", "admin")
    assert len(problems) == 4


def test_create_user_normalizes_email_and_blocks_duplicates():
    user = store.create_user(" Ana@Exemplo.com ", "Ana", hash_password("12345678"), "support")
    assert user.email == "ana@exemplo.com" and user.role == "support"
    assert "password" not in user.model_dump() and "password_hash" not in user.model_dump()
    with pytest.raises(ValueError):
        store.create_user("ANA@exemplo.com", "Outra", hash_password("12345678"), "support")


def test_session_lifecycle():
    user = store.create_user("ana@exemplo.com", "Ana", hash_password("12345678"), "coordination")
    token = new_token()
    store.create_session(user.id, token_hash(token))
    assert store.find_session_user(token_hash(token)).id == user.id
    assert store.find_session_user(token_hash("token-errado")) is None
    store.delete_session(token_hash(token))
    assert store.find_session_user(token_hash(token)) is None


def test_session_expires():
    user = store.create_user("ana@exemplo.com", "Ana", hash_password("12345678"), "coordination")
    token = new_token()
    store.create_session(user.id, token_hash(token))
    now = store._clock()
    store._clock = lambda: now + timedelta(hours=13)  # passou das 12 h
    assert store.find_session_user(token_hash(token)) is None


# ---------- rotas de login ----------

LOGIN = {"email": "ana@exemplo.com", "password": "senha-forte-123"}


@pytest.fixture
def tc():
    login_limiter.reset()
    store.create_user("ana@exemplo.com", "Ana", hash_password("senha-forte-123"), "coordination")
    return TestClient(app)


def test_login_sets_httponly_cookie_and_me_works(tc):
    r = tc.post("/api/auth/login", json={**LOGIN, "email": " ANA@exemplo.com "})
    assert r.status_code == 200
    assert r.json()["email"] == "ana@exemplo.com" and r.json()["role"] == "coordination"
    cookie = r.headers["set-cookie"]
    assert "em_session=" in cookie and "HttpOnly" in cookie and "SameSite=lax" in cookie
    me = tc.get("/api/auth/me")
    assert me.status_code == 200 and me.json()["name"] == "Ana"


def test_me_without_session_is_401(tc):
    r = tc.get("/api/auth/me")
    assert r.status_code == 401 and r.json() == {"error": "Faça login para continuar."}


def test_wrong_password_and_unknown_email_get_same_message(tc):
    wrong = tc.post("/api/auth/login", json={**LOGIN, "password": "errada123"})
    unknown = tc.post("/api/auth/login", json={**LOGIN, "email": "ninguem@exemplo.com"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json() == {"error": "E-mail ou senha incorretos."}
    assert "set-cookie" not in wrong.headers


def test_login_requires_email_and_password(tc):
    r = tc.post("/api/auth/login", json={"email": "ana@exemplo.com"})
    assert r.status_code == 422 and r.json() == {"error": "Informe e-mail e senha."}


def test_too_many_wrong_logins_are_blocked_for_a_minute(tc):
    for _ in range(5):
        tc.post("/api/auth/login", json={**LOGIN, "password": "errada123"})
    r = tc.post("/api/auth/login", json=LOGIN)  # ate a senha certa e recusada
    assert r.status_code == 429
    now = login_limiter.clock()
    login_limiter.clock = lambda: now + 61
    assert tc.post("/api/auth/login", json=LOGIN).status_code == 200


def test_logout_ends_session_immediately(tc):
    tc.post("/api/auth/login", json=LOGIN)
    token = tc.cookies.get("em_session")
    assert tc.post("/api/auth/logout").status_code == 204
    assert tc.get("/api/auth/me").status_code == 401
    # O token antigo nao vale mais, mesmo se alguem o guardou.
    tc.cookies.set("em_session", token)
    assert tc.get("/api/auth/me").status_code == 401


# ---------- o que cada perfil pode fazer ----------

def login_as(tc, role):
    email = f"{role}@exemplo.com"
    store.create_user(email, role, hash_password("senha-forte-123"), role)
    assert tc.post("/api/auth/login", json={**LOGIN, "email": email}).status_code == 200


def test_dashboard_routes_require_login(tc):
    for method, path in [
        ("get", "/api/clients"),
        ("get", "/api/experiences"),
        ("get", "/api/images"),
        ("get", "/api/settings"),
        ("get", "/api/focus"),
        ("put", "/api/clients/cli-2/content"),
        ("post", "/api/clients/identify"),
        ("put", "/api/experiences/exp-1/active"),
    ]:
        r = getattr(tc, method)(path, **({} if method == "get" else {"json": {}}))
        assert r.status_code == 401, (method, path)


def test_player_routes_stay_open(tc):
    assert tc.get("/api/clients/cli-1/display").status_code == 200
    r = tc.post("/api/clients/cli-1/heartbeat", json={"orientation": "landscape"})
    assert r.status_code == 204
    assert tc.get("/api/health").status_code == 200


def test_support_can_operate_screens(tc):
    login_as(tc, "support")
    assert tc.get("/api/experiences").status_code == 200
    r = tc.put("/api/clients/cli-2/content", json={"experienceId": "exp-3"})
    assert r.status_code == 200
    assert tc.post("/api/clients/identify").status_code == 200
    assert tc.post("/api/focus", json={"clientId": "cli-1"}).status_code == 201
    assert tc.delete("/api/focus").status_code == 200


def test_support_cannot_change_catalog_settings_or_positions(tc):
    login_as(tc, "support")
    forbidden = {"error": "Seu perfil não permite esta ação."}
    for method, path, body in [
        ("put", "/api/experiences/exp-1/active", {"active": False}),
        ("post", "/api/images", {}),
        ("put", "/api/settings", {"standbyImageId": None}),
        ("put", "/api/clients/cli-4/position", {"x": 10, "y": 10}),
        ("put", "/api/clients/cli-4/lock", {"locked": True}),
    ]:
        r = getattr(tc, method)(path, json=body)
        assert r.status_code == 403 and r.json() == forbidden, (method, path)


def test_coordination_can_change_catalog(tc):
    login_as(tc, "coordination")
    r = tc.put("/api/experiences/exp-1/active", json={"active": False})
    assert r.status_code == 200


def test_dashboard_socket_requires_login(tc):
    with pytest.raises(WebSocketDisconnect) as closed:
        with tc.websocket_connect("/ws/dashboard") as ws:
            ws.receive_json()
    assert closed.value.code == 4401


def test_dashboard_socket_with_session(tc):
    tc.post("/api/auth/login", json=LOGIN)
    cookie = f"em_session={tc.cookies.get('em_session')}"
    with tc.websocket_connect("/ws/dashboard", headers={"cookie": cookie}) as ws:
        assert ws.receive_json()["type"] == "state"


# ---------- fim da sessao ----------

def count_sessions():
    with store._session() as s:
        return s.scalar(select(func.count()).select_from(SessionRow))


def test_login_deletes_expired_sessions(tc):
    tc.post("/api/auth/login", json=LOGIN)
    user_id = tc.get("/api/auth/me").json()["id"]
    store.create_session(user_id, token_hash(new_token()))
    store.create_session(user_id, token_hash(new_token()))
    assert count_sessions() == 3
    now = store._clock()
    store._clock = lambda: now + timedelta(hours=13)  # todas venceram
    assert tc.post("/api/auth/login", json=LOGIN).status_code == 200
    assert count_sessions() == 1  # so a sessao nova
    assert store.delete_expired_sessions() == 0


def test_logout_closes_dashboard_socket(tc):
    with tc:  # mesmo laco de eventos para o WebSocket e o logout
        tc.post("/api/auth/login", json=LOGIN)
        cookie = f"em_session={tc.cookies.get('em_session')}"
        with tc.websocket_connect("/ws/dashboard", headers={"cookie": cookie}) as ws:
            assert ws.receive_json()["type"] == "state"
            assert tc.post("/api/auth/logout").status_code == 204
            with pytest.raises(WebSocketDisconnect) as closed:
                ws.receive_json()
            assert closed.value.code == 4401


def test_logout_keeps_other_sessions_open(tc):
    with tc:
        tc.post("/api/auth/login", json=LOGIN)
        cookie = f"em_session={tc.cookies.get('em_session')}"
        with tc.websocket_connect("/ws/dashboard", headers={"cookie": cookie}) as ws:
            ws.receive_json()
            # Outra sessao (outro navegador) faz logout.
            token = new_token()
            user_id = tc.get("/api/auth/me").json()["id"]
            store.create_session(user_id, token_hash(token))
            mine = tc.cookies.get("em_session")
            tc.cookies.clear()  # cada pedido abaixo informa o proprio cookie
            r = tc.post("/api/auth/logout", headers={"cookie": f"em_session={token}"})
            assert r.status_code == 204
            r = tc.put("/api/experiences/exp-1/active", json={"active": False},
                       headers={"cookie": f"em_session={mine}"})
            assert r.status_code == 200
            assert ws.receive_json()["type"] == "state"  # esta aba segue recebendo