"""Login do dashboard: senhas, usuarios e sessoes."""

from datetime import timedelta

import pytest
from fastapi.testclient import TestClient

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