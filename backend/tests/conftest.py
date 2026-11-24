"""Configuracao dos testes: roda antes de qualquer arquivo de teste.

Os testes usam um banco em memoria, para nunca apagar o banco de
desenvolvimento (experience-manager.db).
"""

import os

os.environ["DATABASE_URL"] = "sqlite://"