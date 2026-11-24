import os


def _split(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


# Os monitores (TVs e tablets) abrem o client-app em IPs variados da rede,
# por isso o padrao em desenvolvimento e liberar tudo. Restringir em producao.
CORS_ORIGINS: list[str] = _split(os.getenv("CORS_ORIGINS", "*"))

# Sinal de vida: a tela avisa a cada ~5 s. Sem aviso por mais que este tempo,
# ela passa a ser considerada desligada (3 avisos perdidos).
HEARTBEAT_TIMEOUT_SECONDS: float = float(os.getenv("HEARTBEAT_TIMEOUT_SECONDS", "15"))