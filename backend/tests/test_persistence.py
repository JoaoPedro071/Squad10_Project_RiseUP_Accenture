"""Os dados sobrevivem a um reinicio da API?

Cada teste abre o store num arquivo SQLite temporario, grava algo, "reinicia"
(fecha e abre um store novo no mesmo arquivo) e confere o que ficou.
"""

import pytest

from models.store import Store


@pytest.fixture
def db_url(tmp_path):
    return f"sqlite:///{(tmp_path / 'test.db').as_posix()}"


@pytest.fixture
def open_store(db_url):
    opened: list[Store] = []

    def _open() -> Store:
        store = Store(db_url)
        opened.append(store)
        return store

    yield _open
    for store in opened:
        store.close()


def restart(store: Store, open_store) -> Store:
    store.close()
    return open_store()


def test_seed_only_on_empty_database(open_store):
    first = open_store()
    assert len(first.list_clients()) == 4
    second = restart(first, open_store)
    assert len(second.list_clients()) == 4
    assert len(second.list_experiences()) == 4


def test_catalog_survives_restart(open_store):
    store = open_store()
    exp = store.create_experience(
        {"title": "Nova", "url": "https://example.com", "type": "web", "orientation": "any"}
    )
    img = store.create_image(
        {"title": "Logo", "url": "https://example.com/a.png", "orientation": "any"}
    )
    store.set_image_active("img-1", False)

    store = restart(store, open_store)
    assert store.find_experience(exp.id).title == "Nova"
    assert store.find_image(img.id).title == "Logo"
    assert store.find_image("img-1").active is False
    # A ordem de cadastro e mantida: o novo item vem por ultimo.
    assert store.list_experiences()[-1].id == exp.id


def test_screen_changes_survive_restart(open_store):
    store = open_store()
    store.set_content("cli-2", current_experience_id="exp-3", img_id="img-1", display_img=True)
    store.update_client("cli-4", x=10, y=20, locked=True)

    store = restart(store, open_store)
    cli2 = store.find_client("cli-2")
    assert (cli2.current_experience_id, cli2.img_id, cli2.display_img) == ("exp-3", "img-1", True)
    cli4 = store.find_client("cli-4")
    assert (cli4.x, cli4.y, cli4.locked) == (10, 20, True)


def test_settings_and_focus_survive_restart(open_store):
    store = open_store()
    store.set_standby_image("img-1")
    store.record_heartbeat("cli-1", "landscape", None)
    assert store.start_focus("cli-1").client_id == "cli-1"

    store = restart(store, open_store)
    assert store.get_settings().standby_image_id == "img-1"
    assert store.get_focus().client_id == "cli-1"
    assert store.end_focus() is True
    assert store.get_focus() is None


def test_heartbeat_is_not_saved(open_store):
    """O sinal de vida fica so em memoria: apos reiniciar, a tela aparece
    desligada ate mandar o proximo aviso, sem perder o conteudo."""
    store = open_store()
    store.record_heartbeat("cli-1", "landscape", "1920x1080")
    assert store.find_client("cli-1").status == "busy"

    store = restart(store, open_store)
    cli1 = store.find_client("cli-1")
    assert cli1.status == "off"
    assert cli1.reported_orientation is None
    assert cli1.current_experience_id == "exp-1"

    store.record_heartbeat("cli-1", "landscape", None)
    assert store.find_client("cli-1").status == "busy"