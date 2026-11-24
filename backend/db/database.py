"""Conexao com o banco de dados (SQLAlchemy)."""

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    """Base de todas as tabelas (db/tables.py)."""


def make_engine(url: str) -> Engine:
    """Cria a conexao a partir da URL (ex.: DATABASE_URL do config.py)."""
    if not url.startswith("sqlite"):
        return create_engine(url)

    # SQLite: a API atende requisicoes em varias threads.
    options: dict = {"connect_args": {"check_same_thread": False}}
    if url in ("sqlite://", "sqlite:///:memory:"):
        # Banco em memoria (testes): todas as conexoes usam o mesmo banco.
        options["poolclass"] = StaticPool
    engine = create_engine(url, **options)

    # O SQLite so confere as chaves estrangeiras se isto for ligado.
    @event.listens_for(engine, "connect")
    def _enable_foreign_keys(dbapi_connection, _record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    return engine


def create_tables(engine: Engine) -> None:
    """Cria as tabelas que ainda nao existem (nao apaga dados)."""
    from db import tables  # noqa: F401  (registra as tabelas na Base)

    Base.metadata.create_all(engine)