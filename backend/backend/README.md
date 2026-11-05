# Backend: Experience Manager API (FastAPI)

Fatia 1: contrato idêntico ao back-end simulado que existia no dashboard (`app/api/*` + `lib/store.ts`), agora em FastAPI. Estado em memória (reinicia ao subir) e um único worker.

## Rodar

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn main:app --reload --port 8000
pytest
```

Docs interativas: http://localhost:8000/docs

## Contrato (JSON em camelCase)

| Rota | Corpo | Sucesso | Erros |
|---|---|---|---|
| `GET /api/experiences` | n/a | `Experience[]` | n/a |
| `POST /api/experiences` | title, description, url, type, orientation | 201 `Experience` | 400 `{fieldErrors}` |
| `GET /api/clients` | n/a | `Client[]` | n/a |
| `PUT /api/clients/{id}/assignment` | `{experienceId}` | `Client` | 422 `{error}`, 404 `{error}` |
| `PUT /api/clients/{id}/display` | `{displayOff: bool}` | `Client` | 422 `{error}`, 404 `{error}` |
| `GET /api/clients/{id}/display` | n/a | `DisplayState` (`no-store`) | 404 `{error}` |
| `GET /api/health` | n/a | `{status: "ok"}` | n/a |

`DisplayState`: `{kind: "waiting"}`, `{kind: "off"}`, `{kind: "error"}` ou `{kind: "showing", experience}`. Prioridade: tela desligada, depois experiência atribuída, senão aguardando.

## Estrutura

```
main.py            app, CORS e routers
config.py          variáveis de ambiente (CORS_ORIGINS)
errors.py          formatos de erro que o front espera
routers/           experiences.py e clients.py (monitores)
schemas/           Pydantic com alias camelCase
models/            store em memória + seed (vira SQLAlchemy na fatia 2)
services/          validation.py (e ai_service.py na fatia 4)
tests/             pytest
```

Observação: o documento de arquitetura previa `monitors.py` e `assignments.py`. Como o front chama o monitor de `client` e usa `/api/clients/...`, ficou tudo em `routers/clients.py`.

## Próximas fatias

2. Persistência (SQLAlchemy, SQLite no dev e Postgres no deploy) mantendo a interface de `models/store.py`.
3. Heartbeat e status online/offline real; depois WebSocket no lugar do polling.
4. IA: `POST /api/ai/interpret` (só propõe) e aplicação em lote com confirmação.
