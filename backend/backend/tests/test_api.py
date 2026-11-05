import pytest
from fastapi.testclient import TestClient

from main import app
from models.store import store


@pytest.fixture(autouse=True)
def fresh_store():
    store.reset()


client = TestClient(app)

VALID = {
    "title": "Nova demo",
    "description": "Teste",
    "url": "https://example.com",
    "type": "web",
    "orientation": "any",
}


def test_list_experiences_camel_case():
    r = client.get("/api/experiences")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 5
    assert set(data[0]) == {"id", "title", "description", "url", "type", "orientation", "active"}


def test_list_clients_camel_case():
    r = client.get("/api/clients")
    assert r.status_code == 200
    assert set(r.json()[0]) == {
        "id", "name", "status", "orientation", "currentExperienceId", "displayOff"
    }


def test_create_experience_ok():
    r = client.post("/api/experiences", json=VALID)
    assert r.status_code == 201
    body = r.json()
    assert body["active"] is True and body["id"].startswith("exp-")
    assert len(client.get("/api/experiences").json()) == 6


def test_create_experience_field_errors():
    r = client.post("/api/experiences", json={"title": " ", "url": "ftp://x", "type": "pdf"})
    assert r.status_code == 400
    errors = r.json()["fieldErrors"]
    assert errors["title"] == "Informe o título da experiência."
    assert errors["url"] == "Use um endereço começando com http:// ou https://."
    assert errors["type"] == "Escolha o tipo de conteúdo."
    assert errors["orientation"] == "Escolha a orientação."


def test_create_experience_accepts_internal_path():
    r = client.post("/api/experiences", json={**VALID, "url": "/demo"})
    assert r.status_code == 201


def test_create_experience_invalid_json_body():
    r = client.post("/api/experiences", content="nao e json",
                    headers={"Content-Type": "application/json"})
    assert r.status_code == 400
    assert "title" in r.json()["fieldErrors"]


def test_assignment_ok_turns_display_on():
    r = client.put("/api/clients/cli-2/assignment", json={"experienceId": "exp-3"})
    assert r.status_code == 200
    body = r.json()
    assert body["currentExperienceId"] == "exp-3"
    assert body["displayOff"] is False


def test_assignment_inactive_or_unknown_experience():
    for exp in ("exp-5", "nao-existe"):
        r = client.put("/api/clients/cli-1/assignment", json={"experienceId": exp})
        assert r.status_code == 422
        assert r.json() == {"error": "Experiência indisponível"}


def test_assignment_unknown_client():
    r = client.put("/api/clients/xxx/assignment", json={"experienceId": "exp-1"})
    assert r.status_code == 404
    assert r.json() == {"error": "Tela não encontrada"}


def test_set_display():
    r = client.put("/api/clients/cli-1/display", json={"displayOff": True})
    assert r.status_code == 200 and r.json()["displayOff"] is True
    assert client.put("/api/clients/cli-1/display", json={"displayOff": "sim"}).status_code == 422
    assert client.put("/api/clients/xxx/display", json={"displayOff": True}).status_code == 404


def test_display_states():
    showing = client.get("/api/clients/cli-1/display")
    assert showing.status_code == 200
    assert showing.headers["cache-control"] == "no-store"
    assert showing.json()["kind"] == "showing"
    assert showing.json()["experience"]["id"] == "exp-1"

    assert client.get("/api/clients/cli-2/display").json() == {"kind": "off"}
    assert client.get("/api/clients/cli-4/display").json() == {"kind": "waiting"}
    r = client.get("/api/clients/xxx/display")
    assert r.status_code == 404 and r.json() == {"error": "Tela não encontrada"}


def test_display_follows_dashboard_changes():
    client.put("/api/clients/cli-4/assignment", json={"experienceId": "exp-2"})
    assert client.get("/api/clients/cli-4/display").json()["experience"]["id"] == "exp-2"
    client.put("/api/clients/cli-4/display", json={"displayOff": True})
    assert client.get("/api/clients/cli-4/display").json() == {"kind": "off"}


def test_cors_preflight():
    r = client.options(
        "/api/clients/cli-1/assignment",
        headers={"Origin": "http://localhost:3000",
                 "Access-Control-Request-Method": "PUT",
                 "Access-Control-Request-Headers": "content-type"},
    )
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] in ("*", "http://localhost:3000")


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}
