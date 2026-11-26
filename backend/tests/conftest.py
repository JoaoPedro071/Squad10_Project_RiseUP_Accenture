"""Configuracao dos testes: roda antes de qualquer arquivo de teste.

- Banco em memoria, para nunca apagar o banco de desenvolvimento
  (experience-manager.db).
- Por padrao, os testes rodam como um usuario de Coordenacao ja logado.
  Os testes de login (test_auth.py) desligam isso para testar de verdade.
"""

import os

import pytest

os.environ["DATABASE_URL"] = "sqlite://"


@pytest.fixture(autouse=True)
def logged_in_as_coordination():
    # Importados aqui para ler o DATABASE_URL acima.
    from dependencies import current_user, socket_user
    from main import app
    from schemas.user import User

    user = User(id="usr-teste", email="teste@exemplo.com", name="Teste",
                role="coordination", active=True)
    app.dependency_overrides[current_user] = lambda: user
    app.dependency_overrides[socket_user] = lambda: user
    yield
    app.dependency_overrides.clear()