"""Login do dashboard: senhas, usuarios e sessoes."""

from datetime import timedelta

import pytest

from models.store import store
from services.auth import (
    hash_password,
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