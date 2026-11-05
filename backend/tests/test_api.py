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
        "id", "name", "room", "status", "orientation",
        "currentExperienceId", "displayOff", "x", "y", "locked",
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
    assert client.get("/health").json() == {"status": "ok"}


# ---------- posicao e trava (planta) ----------

def test_move_client_ok_when_unlocked():
    r = client.put("/api/clients/cli-3/position", json={"x": 40, "y": 55.5})
    assert r.status_code == 200
    assert (r.json()["x"], r.json()["y"]) == (40, 55.5)


def test_move_client_locked_is_forbidden():
    r = client.put("/api/clients/cli-1/position", json={"x": 10, "y": 10})
    assert r.status_code == 403
    assert r.json() == {"error": "Esta tela está travada"}


def test_move_client_invalid_position():
    for body in ({"x": 101, "y": 10}, {"x": -1, "y": 10}, {"x": "a", "y": 1},
                 {"x": True, "y": 1}, {"x": 5}):
        r = client.put("/api/clients/cli-3/position", json=body)
        assert r.status_code == 422, body
        assert r.json() == {"error": "Posição inválida"}


def test_move_client_unknown():
    r = client.put("/api/clients/xxx/position", json={"x": 1, "y": 1})
    assert r.status_code == 404


def test_lock_and_unlock():
    r = client.put("/api/clients/cli-1/lock", json={"locked": False})
    assert r.status_code == 200 and r.json()["locked"] is False
    assert client.put("/api/clients/cli-1/position", json={"x": 5, "y": 5}).status_code == 200
    assert client.put("/api/clients/cli-1/lock", json={"locked": "sim"}).status_code == 422
    assert client.put("/api/clients/xxx/lock", json={"locked": True}).status_code == 404


# ---------- modo foco ----------

def test_focus_initial_state():
    r = client.get("/api/focus")
    assert r.status_code == 200
    body = r.json()
    assert body["focus"] is None
    assert len(body["clients"]) == 4


def test_focus_start_darkens_only_online_and_on():
    r = client.post("/api/focus", json={"clientId": "cli-1"})
    assert r.status_code == 201
    body = r.json()
    assert body["focus"] == {
        "clientId": "cli-1", "affectedIds": ["cli-3"], "offlineIds": ["cli-4"]
    }
    by_id = {c["id"]: c for c in body["clients"]}
    assert by_id["cli-3"]["displayOff"] is True    # estava ligada, apagou
    assert by_id["cli-2"]["displayOff"] is True    # ja estava apagada
    assert by_id["cli-1"]["displayOff"] is False   # a que apresenta


def test_focus_errors():
    assert client.post("/api/focus", json={"clientId": "xxx"}).status_code == 404
    off = client.post("/api/focus", json={"clientId": "cli-4"})
    assert off.status_code == 422 and off.json() == {"error": "A tela está offline"}
    client.post("/api/focus", json={"clientId": "cli-1"})
    again = client.post("/api/focus", json={"clientId": "cli-3"})
    assert again.status_code == 409
    assert again.json() == {"error": "O Modo foco já está ativo"}


def test_focus_end_restores_only_affected():
    client.post("/api/focus", json={"clientId": "cli-1"})
    r = client.delete("/api/focus")
    assert r.status_code == 200
    body = r.json()
    assert body["focus"] is None
    by_id = {c["id"]: c for c in body["clients"]}
    assert by_id["cli-3"]["displayOff"] is False   # voltou
    assert by_id["cli-2"]["displayOff"] is True    # continua como estava


def test_focus_end_without_active_is_ok():
    r = client.delete("/api/focus")
    assert r.status_code == 200 and r.json()["focus"] is None
