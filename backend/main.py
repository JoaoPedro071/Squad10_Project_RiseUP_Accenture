from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from errors import register_error_handlers
from routers import clients, experiences, focus, images, settings, ws

app = FastAPI(title="Experience Manager API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)
register_error_handlers(app)

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
