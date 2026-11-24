import os


def _split(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


# --- ambiente ---
# "development" (padrao) ou "production".
APP_ENV: str = os.getenv("APP_ENV", "development").strip().lower()


# --- CORS: quais sites (front-ends) podem chamar esta API pelo navegador ---
# A "origem" e o endereco do SITE (dashboard e player), nao o IP de cada TV:
# todas as telas abrem o player do mesmo endereco, entao a lista e curta.
DEFAULT_CORS_ORIGINS = "http://localhost:3000,http://localhost:3001"


def load_cors_origins(raw: str | None, app_env: str) -> list[str]:
    """Le a lista de origens. Vazio = padrao de desenvolvimento.

    "*" (qualquer site) so e aceito fora de producao.
    """
    if raw is None or not raw.strip():
        raw = DEFAULT_CORS_ORIGINS
    origins = _split(raw)
    if "*" in origins and app_env == "production":
        raise RuntimeError(
            "CORS_ORIGINS='*' não é permitido em produção. "
            "Informe os endereços do dashboard e do player."
        )
    return origins


CORS_ORIGINS: list[str] = load_cors_origins(os.getenv("CORS_ORIGINS"), APP_ENV)


# Sinal de vida: a tela avisa a cada ~5 s. Sem aviso por mais que este tempo,
# ela passa a ser considerada desligada (3 avisos perdidos).
HEARTBEAT_TIMEOUT_SECONDS: float = float(os.getenv("HEARTBEAT_TIMEOUT_SECONDS", "15"))