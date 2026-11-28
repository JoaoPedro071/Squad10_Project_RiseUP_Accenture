from datetime import timedelta
import pytest
from fastapi.testclient import TestClient

from config import load_cors_origins
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
    assert set(data[0]) == {
        "id", "title", "description", "url", "type", "orientation", "active",
    }


def test_list_clients_camel_case():
    r = client.get("/api/clients")
    assert r.status_code == 200
    assert set(r.json()[0]) == {
        "id", "name", "status", "orientationMismatch",
        "currentExperienceId", "imgId", "displayImg",
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


# ---------- editar e inativar experiencias ----------

def test_update_experience_ok():
    r = client.put("/api/experiences/exp-1", json={**VALID, "title": "  Ciber 2.0 "})
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "exp-1" and body["title"] == "Ciber 2.0"
    assert body["active"] is True  # editar nao muda o status
    listed = {e["id"]: e for e in client.get("/api/experiences").json()}
    assert listed["exp-1"]["title"] == "Ciber 2.0"


def test_update_experience_field_errors_keep_old_data():
    r = client.put("/api/experiences/exp-1", json={**VALID, "title": " "})
    assert r.status_code == 400
    errors = r.json()["fieldErrors"]
    assert "title" in errors
    listed = {e["id"]: e for e in client.get("/api/experiences").json()}
    assert listed["exp-1"]["title"] == "Cibersegurança"


def test_update_experience_not_found():
    r = client.put("/api/experiences/xxx", json=VALID)
    assert r.status_code == 404 and r.json() == {"error": "Experiência não encontrada"}


def test_update_experience_in_use_changes_what_screen_shows():
    # cli-1 exibe exp-1 (paisagem). Mudar para retrato gera aviso de orientacao.
    client.put("/api/experiences/exp-1", json={**VALID, "orientation": "portrait"})
    cli1 = next(c for c in client.get("/api/clients").json() if c["id"] == "cli-1")
    assert cli1["orientationMismatch"] is True and cli1["status"] == "error"


def test_experience_inactivate_and_reactivate():
    r = client.put("/api/experiences/exp-1/active", json={"active": False})
    assert r.status_code == 200 and r.json()["active"] is False
    # Inativar nao apaga e nao tira da tela que ja exibe (EC18).
    assert len(client.get("/api/experiences").json()) == 4
    display = client.get("/api/clients/cli-1/display").json()
    assert display["kind"] == "experience" and display["experience"]["id"] == "exp-1"
    r = client.put("/api/experiences/exp-1/active", json={"active": True})
    assert r.status_code == 200 and r.json()["active"] is True


def test_inactive_experience_cannot_be_assigned():
    client.put("/api/experiences/exp-2/active", json={"active": False})
    r = client.put("/api/clients/cli-2/content", json={"experienceId": "exp-2"})
    assert r.status_code == 422


def test_experience_active_errors():
    r = client.put("/api/experiences/exp-1/active", json={"active": "sim"})
    assert r.status_code == 422 and r.json() == {"error": "Campo active inválido"}
    r = client.put("/api/experiences/xxx/active", json={"active": False})
    assert r.status_code == 404 and r.json() == {"error": "Experiência não encontrada"}


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


def test_update_image_ok_and_errors():
    r = client.put("/api/images/img-1", json={**VALID_IMAGE, "title": " Cartaz novo "})
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "img-1" and body["title"] == "Cartaz novo"
    assert body["active"] is True
    r = client.put("/api/images/img-1", json={**VALID_IMAGE, "url": "ftp://x"})
    assert r.status_code == 400 and "url" in r.json()["fieldErrors"]
    r = client.put("/api/images/xxx", json=VALID_IMAGE)
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
    assert tela["cli-1"]["status"] == "busy" and tela["cli-1"]["lastSeenAt"] is not None
    assert tela["cli-4"]["status"] == "off" and tela["cli-4"]["lastSeenAt"] is None


def test_heartbeat_brings_screen_online_and_records_info():
    r = heartbeat("cli-4", {"orientation": "portrait", "resolution": "1080x1920"})
    assert r.status_code == 204
    tela = screens()["cli-4"]
    assert tela["status"] == "standby"  # ligada, sem conteudo
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
    assert tela["status"] == "off"
    assert tela["currentExperienceId"] == "exp-1"  # a atribuicao fica guardada
    heartbeat("cli-1", {"orientation": "landscape"})
    tela = screens()["cli-1"]
    assert tela["status"] == "busy"
    assert tela["currentExperienceId"] == "exp-1"  # volta exibindo o mesmo


def test_screen_still_online_within_timeout():
    advance_clock(10)
    assert screens()["cli-1"]["status"] == "busy"


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


# ---------- status da tela (5 estados) e orientacao ----------

def test_seed_statuses():
    tela = screens()
    assert tela["cli-1"]["status"] == "busy"     # exibe experiencia
    assert tela["cli-2"]["status"] == "standby"  # ligada, sem conteudo
    assert tela["cli-3"]["status"] == "busy"     # exibe imagem
    assert tela["cli-4"]["status"] == "off"      # nunca deu sinal


def test_status_standby_when_no_content():
    r = put_content("cli-1", {"experienceId": None})
    assert r.json()["status"] == "standby"


def test_orientation_mismatch_is_error():
    # exp-1 e para paisagem; a tela passa a informar retrato.
    heartbeat("cli-1", {"orientation": "portrait"})
    tela = screens()["cli-1"]
    assert tela["orientationMismatch"] is True and tela["status"] == "error"
    # Trocar por uma experiencia "qualquer orientacao" resolve.
    r = put_content("cli-1", {"experienceId": "exp-2"})
    assert r.json()["orientationMismatch"] is False and r.json()["status"] == "busy"


def test_orientation_mismatch_with_image():
    heartbeat("cli-3", {"orientation": "landscape"})  # img-1 e para retrato
    assert screens()["cli-3"]["status"] == "error"


def test_standby_never_flags_orientation():
    put_content("cli-1", {"experienceId": None})
    heartbeat("cli-1", {"orientation": "portrait"})
    tela = screens()["cli-1"]
    assert tela["status"] == "standby" and tela["orientationMismatch"] is False


def test_paused_wins_over_error():
    heartbeat("cli-1", {"orientation": "portrait"})  # erro de orientacao
    client.post("/api/focus", json={"clientId": "cli-3"})
    tela = screens()["cli-1"]
    assert tela["orientationMismatch"] is True and tela["status"] == "paused"


def test_off_wins_over_everything():
    heartbeat("cli-1", {"orientation": "portrait"})  # erro de orientacao
    advance_clock(16)
    tela = screens()["cli-1"]
    assert tela["status"] == "off"
    assert tela["orientationMismatch"] is True  # o aviso continua visivel


def test_content_on_offline_screen_reports_off():
    # O front usa este status para dizer "sera exibido quando a tela voltar"
    # em vez de um "Concluido" falso.
    r = put_content("cli-4", {"experienceId": "exp-1"})
    assert r.status_code == 200
    assert r.json()["status"] == "off"
    assert r.json()["currentExperienceId"] == "exp-1"


# ---------- o que a tela exibe ----------

def display(client_id):
    return client.get(f"/api/clients/{client_id}/display")


def test_display_experience():
    r = display("cli-1")
    assert r.status_code == 200
    assert r.headers["cache-control"] == "no-store"
    assert r.json()["kind"] == "experience"
    assert r.json()["experience"]["id"] == "exp-1"


def test_display_image():
    r = display("cli-3")
    assert r.json()["kind"] == "image" and r.json()["image"]["id"] == "img-1"


def test_display_paused_is_black():
    client.post("/api/focus", json={"clientId": "cli-1"})
    assert display("cli-3").json() == {"kind": "paused"}


def test_display_standby_without_image_is_black():
    assert display("cli-4").json() == {"kind": "standby", "image": None}


def test_display_standby_uses_global_image():
    client.put("/api/settings", json={"standbyImageId": "img-1"})
    r = display("cli-4").json()
    assert r["kind"] == "standby" and r["image"]["id"] == "img-1"


def test_display_toggle_between_image_and_experience():
    put_content("cli-1", {"imgId": "img-1"})
    assert display("cli-1").json()["kind"] == "image"
    put_content("cli-1", {"displayImg": False})
    assert display("cli-1").json()["kind"] == "experience"


def test_display_image_removed_falls_back_to_standby():
    put_content("cli-3", {"imgId": None})  # o tablet nao tem experiencia
    assert display("cli-3").json()["kind"] == "standby"


def test_display_keeps_inactivated_item_until_changed():
    client.put("/api/images/img-1/active", json={"active": False})
    assert display("cli-3").json()["kind"] == "image"  # continua (EC18)


def test_display_unknown_screen():
    r = display("xxx")
    assert r.status_code == 404 and r.json() == {"error": "Tela não encontrada"}


def test_display_follows_dashboard_changes():
    put_content("cli-4", {"experienceId": "exp-2"})
    assert display("cli-4").json()["experience"]["id"] == "exp-2"
    client.post("/api/focus", json={"clientId": "cli-1"})
    assert display("cli-4").json() == {"kind": "paused"}


# ---------- CORS ----------

def preflight(origin):
    return client.options(
        "/api/clients/cli-1/content",
        headers={"Origin": origin,
                 "Access-Control-Request-Method": "PUT",
                 "Access-Control-Request-Headers": "content-type"},
    )


def test_cors_allows_dashboard_and_player():
    for origin in ("http://localhost:3000", "http://localhost:3001"):
        r = preflight(origin)
        assert r.status_code == 200, origin
        assert r.headers["access-control-allow-origin"] == origin


def test_cors_blocks_unknown_site():
    r = preflight("http://site-qualquer.com")
    assert r.status_code == 400
    assert "access-control-allow-origin" not in r.headers


def test_cors_config_defaults_and_parsing():
    padrao = ["http://localhost:3000", "http://localhost:3001"]
    assert load_cors_origins(None, "development") == padrao
    assert load_cors_origins("   ", "development") == padrao
    assert load_cors_origins(" https://a.com , https://b.com ,", "production") == [
        "https://a.com", "https://b.com"
    ]


def test_cors_wildcard_only_outside_production():
    assert load_cors_origins("*", "development") == ["*"]
    with pytest.raises(RuntimeError):
        load_cors_origins("*", "production")


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


def test_focus_pauses_every_other_screen():
    r = client.post("/api/focus", json={"clientId": "cli-1"})
    assert r.status_code == 201
    body = r.json()
    assert body["focus"] == {"clientId": "cli-1"}
    status = {c["id"]: c["status"] for c in body["clients"]}
    assert status["cli-1"] == "busy"     # a que apresenta segue exibindo
    assert status["cli-2"] == "paused"
    assert status["cli-3"] == "paused"
    assert status["cli-4"] == "off"      # desligada continua desligada
    assert display("cli-1").json()["kind"] == "experience"


def test_focus_does_not_touch_assignments():
    before = screens()
    client.post("/api/focus", json={"clientId": "cli-1"})
    client.delete("/api/focus")
    after = screens()
    for cid in before:
        for field in ("currentExperienceId", "imgId", "displayImg"):
            assert after[cid][field] == before[cid][field]
        assert after[cid]["status"] == before[cid]["status"]


def test_focus_errors():
    assert client.post("/api/focus", json={"clientId": "xxx"}).status_code == 404
    off = client.post("/api/focus", json={"clientId": "cli-4"})
    assert off.status_code == 422 and off.json() == {"error": "A tela está offline"}
    client.post("/api/focus", json={"clientId": "cli-1"})
    again = client.post("/api/focus", json={"clientId": "cli-3"})
    assert again.status_code == 409
    assert again.json() == {"error": "O Modo foco já está ativo"}


def test_content_changed_during_focus_appears_after():
    client.post("/api/focus", json={"clientId": "cli-1"})
    r = put_content("cli-3", {"experienceId": "exp-2"})
    assert r.status_code == 200
    assert r.json()["status"] == "paused"               # segue pausada
    assert display("cli-3").json() == {"kind": "paused"}
    client.delete("/api/focus")
    shown = display("cli-3").json()
    assert shown["kind"] == "experience" and shown["experience"]["id"] == "exp-2"


def test_screen_reconnecting_during_focus_comes_back_paused():
    client.post("/api/focus", json={"clientId": "cli-1"})
    heartbeat("cli-4", {"orientation": "landscape"})   # estava desligada
    assert screens()["cli-4"]["status"] == "paused"
    assert display("cli-4").json() == {"kind": "paused"}


def test_focused_screen_can_change_content():
    client.post("/api/focus", json={"clientId": "cli-1"})
    put_content("cli-1", {"experienceId": "exp-3"})
    assert display("cli-1").json()["experience"]["id"] == "exp-3"


def test_focus_end_without_active_is_ok():
    r = client.delete("/api/focus")
    assert r.status_code == 200 and r.json()["focus"] is None
