import asyncio
import logging
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from errors import register_error_handlers
from routers import auth, clients, experiences, focus, images, settings, ws
from services.realtime import hub, run_ticker

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Checagem periodica das telas (tempo limite do sinal de vida).
    ticker = asyncio.create_task(run_ticker())
    yield
    ticker.cancel()


app = FastAPI(title="Experience Manager API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,  # o navegador envia o cookie de sessao
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)
register_error_handlers(app)


WRITE_METHODS = {"POST", "PUT", "DELETE"}
CONTENT_PATH = re.compile(r"^/api/clients/([^/]+)/content$")


@app.middleware("http")
async def notify_realtime(request: Request, call_next):
    """Depois de qualquer alteracao bem-sucedida, avisa telas e dashboard
    pelo WebSocket. A tela que teve o conteudo trocado sempre recebe o aviso
    (assim ela confirma o recebimento)."""
    response = await call_next(request)
    path = request.url.path
    if (
        request.method in WRITE_METHODS
        and path.startswith("/api/")
        and not path.startswith("/api/auth/")
        and response.status_code < 400
    ):
        match = CONTENT_PATH.match(path)
        try:
            await hub.refresh(
                force_client=match.group(1) if match else None,
                board_only_if_changed=path.endswith("/heartbeat"),
            )
        except Exception:
            logger.exception("Falha ao avisar as telas")
    return response


app.include_router(auth.router)
app.include_router(experiences.router)
app.include_router(images.router)
app.include_router(settings.router)
app.include_router(clients.router)
app.include_router(focus.router)
app.include_router(ws.router)


# /health mantem compatibilidade com o skeleton inicial do back-end.
@app.get("/health", include_in_schema=False)
@app.get("/api/health", tags=["health"])
async def health():
    return {"status": "ok"}
