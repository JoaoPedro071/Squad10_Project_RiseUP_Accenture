from datetime import timedelta
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
    assert len(data) == 4
    assert set(data[0]) == {"id", "title", "description", "url", "type", "orientation", "active"}


def test_list_clients_camel_case():
    r = client.get("/api/clients")
    assert r.status_code == 200
    assert set(r.json()[0]) == {
        "id", "name", "status",
        "currentExperienceId", "imgId", "displayImg", "displayOff",
        "reportedOrientation", "reportedResolution", "lastSeenAt",
        "x", "y", "locked",
    }

def test_seed_tablet_shows_image_and_reports_orientation():
    by_id = {c["id"]: c for c in client.get("/api/clients").json()}
    tablet = by_id["cli-3"]
    assert tablet["imgId"] == "img-1" and tablet["displayImg"] is True
    assert tablet["currentExperienceId"] is None
    assert tablet["reportedOrientation"] == "portrait"
    assert by_id["cli-4"]["reportedOrientation"] is None  # offline, nunca informou


def test_create_experience_ok():
    r = client.post("/api/experiences", json=VALID)
    assert r.status_code == 201
    body = r.json()
    assert body["active"] is True and body["id"].startswith("exp-")
    assert len(client.get("/api/experiences").json()) == 5  # 4 do seed + 1

def test_create_experience_rejects_image_type():
    r = client.post("/api/experiences", json={**VALID, "type": "image"})
    assert r.status_code == 400
    assert r.json()["fieldErrors"]["type"] == "Escolha o tipo de conteúdo."

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

# ---------- imagens ----------

VALID_IMAGE = {
    "title": "Logo animado",
    "description": "Símbolo da marca para o stand-by.",
    "url": "https://example.com/logo.gif",
    "orientation": "landscape",
}


def test_list_images_camel_case():
    r = client.get("/api/images")
    assert r.status_code == 200
    data = r.json()
    assert [i["id"] for i in data] == ["img-1"]
    assert set(data[0]) == {"id", "title", "description", "url", "orientation", "active"}


def test_create_image_ok():
    r = client.post("/api/images", json=VALID_IMAGE)
    assert r.status_code == 201
    body = r.json()
    assert body["id"].startswith("img-") and body["active"] is True
    assert body["orientation"] == "landscape"
    assert len(client.get("/api/images").json()) == 2


def test_create_image_ids_are_unique():
    a = client.post("/api/images", json=VALID_IMAGE).json()["id"]
    b = client.post("/api/images", json=VALID_IMAGE).json()["id"]
    assert a != b


def test_create_image_field_errors():
    r = client.post("/api/images", json={"title": "", "url": "ftp://x", "orientation": "deitada"})
    assert r.status_code == 400
    errors = r.json()["fieldErrors"]
    assert errors["title"] == "Informe o título da imagem."
    assert errors["url"] == "Use um endereço começando com http:// ou https://."
    assert errors["orientation"] == "Escolha a orientação."


def test_create_image_invalid_json_body():
    r = client.post("/api/images", content="nao e json",
                    headers={"Content-Type": "application/json"})
    assert r.status_code == 400
    assert set(r.json()["fieldErrors"]) == {"title", "url", "orientation"}


def test_image_inactivate_and_reactivate():
    r = client.put("/api/images/img-1/active", json={"active": False})
    assert r.status_code == 200 and r.json()["active"] is False
    # Inativar nao apaga: continua no catalogo.
    assert len(client.get("/api/images").json()) == 1
    r = client.put("/api/images/img-1/active", json={"active": True})
    assert r.json()["active"] is True


def test_image_active_errors():
    r = client.put("/api/images/img-1/active", json={"active": "sim"})
    assert r.status_code == 422 and r.json() == {"error": "Campo active inválido"}
    r = client.put("/api/images/xxx/active", json={"active": False})
    assert r.status_code == 404 and r.json() == {"error": "Imagem não encontrada"}

# ---------- configuracoes (stand-by global) ----------

def test_settings_default_has_no_standby():
    r = client.get("/api/settings")
    assert r.status_code == 200
    assert r.json() == {"standbyImageId": None}


def test_set_standby_image_ok_and_clear():
    r = client.put("/api/settings", json={"standbyImageId": "img-1"})
    assert r.status_code == 200 and r.json() == {"standbyImageId": "img-1"}
    assert client.get("/api/settings").json()["standbyImageId"] == "img-1"
    r = client.put("/api/settings", json={"standbyImageId": None})
    assert r.status_code == 200 and r.json() == {"standbyImageId": None}


def test_set_standby_rejects_unknown_inactive_or_invalid():
    client.put("/api/images/img-1/active", json={"active": False})
    for value in ("img-1", "nao-existe", 123):
        r = client.put("/api/settings", json={"standbyImageId": value})
        assert r.status_code == 422, value
        assert r.json() == {"error": "Imagem indisponível"}
    assert client.get("/api/settings").json()["standbyImageId"] is None  # nada mudou


def test_cannot_inactivate_current_standby_image():
    client.put("/api/settings", json={"standbyImageId": "img-1"})
    r = client.put("/api/images/img-1/active", json={"active": False})
    assert r.status_code == 409
    assert r.json() == {"error": "Esta imagem é o stand-by atual. Escolha outro stand-by antes."}
    assert client.get("/api/images").json()[0]["active"] is True

# ---------- conteudo da tela (experiencia, imagem ou nada) ----------

def put_content(client_id, body):
    return client.put(f"/api/clients/{client_id}/content", json=body)


def test_content_choose_experience():
    # O tablet exibe a imagem img-1; escolher uma experiencia passa a exibi-la.
    r = put_content("cli-3", {"experienceId": "exp-2"})
    assert r.status_code == 200
    body = r.json()
    assert body["currentExperienceId"] == "exp-2"
    assert body["displayImg"] is False
    assert body["imgId"] == "img-1"  # a imagem fica guardada


def test_content_choose_image_and_toggle_back():
    r = put_content("cli-1", {"imgId": "img-1"})
    assert r.status_code == 200
    assert r.json()["displayImg"] is True
    assert r.json()["currentExperienceId"] == "exp-1"  # a experiencia fica guardada
    r = put_content("cli-1", {"displayImg": False})
    assert r.json()["displayImg"] is False and r.json()["imgId"] == "img-1"


def test_content_remove_experience():
    # Antes nao havia como deixar uma tela sem experiencia.
    r = put_content("cli-1", {"experienceId": None})
    assert r.status_code == 200
    assert r.json()["currentExperienceId"] is None


def test_content_remove_image_stops_showing_it():
    r = put_content("cli-3", {"imgId": None})
    assert r.status_code == 200
    assert r.json()["imgId"] is None and r.json()["displayImg"] is False


def test_content_display_img_requires_image():
    r = put_content("cli-1", {"displayImg": True})
    assert r.status_code == 422
    assert r.json() == {"error": "Escolha uma imagem antes de exibi-la"}


def test_content_rejects_unavailable_items():
    for value in ("exp-5", "nao-existe", 123):
        r = put_content("cli-1", {"experienceId": value})
        assert r.status_code == 422 and r.json() == {"error": "Experiência indisponível"}
    r = put_content("cli-1", {"imgId": "nao-existe"})
    assert r.status_code == 422 and r.json() == {"error": "Imagem indisponível"}
    r = put_content("cli-1", {"displayImg": "sim"})
    assert r.status_code == 422 and r.json() == {"error": "Campo displayImg inválido"}
    r = put_content("cli-1", {})
    assert r.status_code == 422 and r.json() == {"error": "Nada para alterar"}


def test_content_is_all_or_nothing():
    r = put_content("cli-1", {"experienceId": "exp-2", "imgId": "nao-existe"})
    assert r.status_code == 422
    tela = {c["id"]: c for c in client.get("/api/clients").json()}["cli-1"]
    assert tela["currentExperienceId"] == "exp-1"  # nada mudou


def test_content_unknown_client():
    r = put_content("xxx", {"experienceId": "exp-1"})
    assert r.status_code == 404 and r.json() == {"error": "Tela não encontrada"}


def test_content_turns_display_on_provisional():
    # Comportamento antigo mantido ate a Etapa 8 (Modo foco como camada).
    r = put_content("cli-2", {"experienceId": "exp-3"})
    assert r.json()["displayOff"] is False


# ---------- sinal de vida ----------

def heartbeat(client_id, body):
    return client.post(f"/api/clients/{client_id}/heartbeat", json=body)


def screens():
    return {c["id"]: c for c in client.get("/api/clients").json()}


def advance_clock(seconds):
    """Simula o tempo passando, sem precisar esperar de verdade."""
    current = store._clock()
    store._clock = lambda: current + timedelta(seconds=seconds)


def test_seed_status_comes_from_last_seen():
    tela = screens()
    assert tela["cli-1"]["status"] == "online" and tela["cli-1"]["lastSeenAt"] is not None
    assert tela["cli-4"]["status"] == "offline" and tela["cli-4"]["lastSeenAt"] is None


def test_heartbeat_brings_screen_online_and_records_info():
    r = heartbeat("cli-4", {"orientation": "portrait", "resolution": "1080x1920"})
    assert r.status_code == 204
    tela = screens()["cli-4"]
    assert tela["status"] == "online"
    assert tela["reportedOrientation"] == "portrait"
    assert tela["reportedResolution"] == "1080x1920"
    assert tela["lastSeenAt"] is not None


def test_heartbeat_resolution_is_optional():
    r = heartbeat("cli-1", {"orientation": "portrait"})
    assert r.status_code == 204
    tela = screens()["cli-1"]
    assert tela["reportedOrientation"] == "portrait"
    assert tela["reportedResolution"] == "1920x1080"  # mantem a anterior


def test_screen_goes_offline_after_timeout_and_keeps_content():
    advance_clock(16)  # passou do limite de 15 s sem sinal
    tela = screens()["cli-1"]
    assert tela["status"] == "offline"
    assert tela["currentExperienceId"] == "exp-1"  # a atribuicao fica guardada
    heartbeat("cli-1", {"orientation": "landscape"})
    tela = screens()["cli-1"]
    assert tela["status"] == "online"
    assert tela["currentExperienceId"] == "exp-1"  # volta exibindo o mesmo


def test_screen_still_online_within_timeout():
    advance_clock(10)
    assert screens()["cli-1"]["status"] == "online"


def test_heartbeat_errors():
    for body in ({}, {"orientation": "deitada"}, {"orientation": 1}):
        r = heartbeat("cli-1", body)
        assert r.status_code == 422 and r.json() == {"error": "Orientação inválida"}
    for res in ("grande", "1920 x 1080", 1920):
        r = heartbeat("cli-1", {"orientation": "landscape", "resolution": res})
        assert r.status_code == 422 and r.json() == {"error": "Resolução inválida"}
    r = heartbeat("xxx", {"orientation": "landscape"})
    assert r.status_code == 404 and r.json() == {"error": "Tela não encontrada"}


def test_focus_rejects_screen_that_stopped_responding():
    advance_clock(16)
    r = client.post("/api/focus", json={"clientId": "cli-1"})
    assert r.status_code == 422 and r.json() == {"error": "A tela está offline"}


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
    put_content("cli-4", {"experienceId": "exp-2"})
    assert client.get("/api/clients/cli-4/display").json()["experience"]["id"] == "exp-2"
    client.put("/api/clients/cli-4/display", json={"displayOff": True})
    assert client.get("/api/clients/cli-4/display").json() == {"kind": "off"}


def test_cors_preflight():
    r = client.options(
        "/api/clients/cli-1/content",
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
