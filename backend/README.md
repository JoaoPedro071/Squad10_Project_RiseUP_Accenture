# Backend: Experience Manager API (FastAPI)

API que guarda o estado das telas e do catálogo, valida cada ação e informa a cada tela (player) o que exibir. Estado em memória (reinicia ao subir) e um único worker.

## Rodar

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn main:app --reload --port 8000
pytest                                              # 43 testes
```

Variáveis de ambiente: copie `env.example` para `.env` (o `.env` nunca deve ser commitado).

Docs interativas: http://localhost:8000/docs

> No VS Code, selecione o interpretador do `.venv` (`Ctrl+Shift+P` → *Python: Select Interpreter*); senão o editor acusa imports não resolvidos.

## Modelo

**Tela (`Client`)**

| Campo | Significado |
|---|---|
| `id`, `name` | Identificação. O nome é o que aparece no mapa |
| `currentExperienceId` | Experiência atribuída (ou `null`) |
| `imgId` | Imagem atribuída (ou `null`) |
| `displayImg` | `true` = exibe a imagem no lugar da experiência, sem perder nenhuma das duas |
| `reportedOrientation`, `reportedResolution`, `lastSeenAt` | Informados pela própria tela (sinal de vida, próxima etapa). `null` até a tela se comunicar |
| `x`, `y`, `locked` | Posição na planta, em % (0 a 100), e trava de posição |
| `status` | *Provisório*: `online`/`offline`. Será derivado em 5 estados: Em uso, Stand-by, Em pausa, Erro, Desligada |
| `displayOff` | *Provisório*: usado pelo Modo foco atual. Sai quando o foco virar uma camada |

**Experiência:** `id, title, description, url, type ("web"), orientation ("landscape" | "portrait" | "any"), active`.

**Imagem:** `id, title, description, url, orientation, active`. Catálogo próprio (antes era um tipo de experiência).

**Configurações:** `standbyImageId`, a imagem exibida pelas telas sem conteúdo. `null` = tela preta.

## Contrato (JSON em camelCase)

| Rota | Corpo | Sucesso | Erros |
|---|---|---|---|
| `GET /api/experiences` | n/a | `Experience[]` | n/a |
| `POST /api/experiences` | title, description, url, type, orientation | 201 `Experience` | 400 `{fieldErrors}` |
| `GET /api/images` | n/a | `Image[]` | n/a |
| `POST /api/images` | title, description, url, orientation | 201 `Image` | 400 `{fieldErrors}` |
| `PUT /api/images/{id}/active` | `{active: bool}` | `Image` | 422, 404, 409 (é o stand-by atual) |
| `GET /api/settings` | n/a | `{standbyImageId}` | n/a |
| `PUT /api/settings` | `{standbyImageId: id \| null}` | `{standbyImageId}` | 422 (imagem inexistente ou inativa) |
| `GET /api/clients` | n/a | `Client[]` | n/a |
| `PUT /api/clients/{id}/content` | `{experienceId?, imgId?, displayImg?}` | `Client` | 422 `{error}`, 404 `{error}` |
| `PUT /api/clients/{id}/display` | `{displayOff: bool}` | `Client` | 422, 404 *(provisório)* |
| `GET /api/clients/{id}/display` | n/a | `DisplayState` (`no-store`) | 404 |
| `PUT /api/clients/{id}/position` | `{x, y}` em % (0 a 100) | `Client` | 422, 403 (tela travada), 404 |
| `PUT /api/clients/{id}/lock` | `{locked: bool}` | `Client` | 422, 404 |
| `GET /api/focus` | n/a | `{focus, clients}` | n/a |
| `POST /api/focus` | `{clientId}` | 201 `{focus, clients}` | 404, 422 (offline), 409 (já ativo) |
| `DELETE /api/focus` | n/a | `{focus: null, clients}` | n/a |
| `GET /api/health` | n/a | `{status: "ok"}` | n/a |

Formatos de erro: validação de cadastro devolve 400 `{"fieldErrors": {campo: mensagem}}`; os demais devolvem `{"error": "mensagem"}`.

### Conteúdo da tela (`PUT /api/clients/{id}/content`)

Só os campos **enviados** mudam; `null` remove.

| Envio | Efeito |
|---|---|
| `{"experienceId": "exp-2"}` | Passa a exibir a experiência (`displayImg` vira `false`) |
| `{"imgId": "img-1"}` | Passa a exibir a imagem (`displayImg` vira `true`); a experiência fica guardada |
| `{"displayImg": false}` | Alterna para a experiência guardada (`true` volta para a imagem) |
| `{"experienceId": null}` / `{"imgId": null}` | Remove a experiência / a imagem |

Só aceita itens existentes e ativos, recusa `displayImg: true` sem imagem e é **tudo ou nada**: se qualquer campo for inválido, nada é gravado.

### O que a tela exibe (`DisplayState`)

`{kind: "waiting"}`, `{kind: "off"}`, `{kind: "error"}` ou `{kind: "showing", experience}`.

> Em revisão: a nova prioridade (Modo foco → imagem → experiência → stand-by) entra numa próxima etapa. Até lá, uma tela que exibe imagem aparece como `waiting`.

Modo foco (atual): uma tela apresenta e as outras que estão online e ligadas apagam; ao encerrar, só as que foram apagadas voltam.

## Estrutura

```
main.py            app, CORS e routers
config.py          variáveis de ambiente (CORS_ORIGINS)
errors.py          formatos de erro que o front espera
routers/           experiences.py, images.py, settings.py, clients.py (telas), focus.py
schemas/           Pydantic com alias camelCase
models/            store em memória + seed (vira SQLAlchemy depois)
services/          validation.py (e ai_service.py no futuro)
tests/             pytest
```

Observação: o documento de arquitetura previa `monitors.py` e `assignments.py`. Como o front chama a tela de `client` e usa `/api/clients/...`, ficou tudo em `routers/clients.py`.

## Próximas etapas

5. Sinal de vida: a tela informa orientação e resolução e fica *Desligada* quando para de responder.
6. Status derivado (5 estados) e aviso de orientação incompatível.
7. `GET /display` com a nova prioridade, incluindo imagem e stand-by.
8. Modo foco como camada (sem alterar atribuições); saem `displayOff` e `PUT /display`.
9. CORS restrito por variável de ambiente.
10. Documentação final do contrato.

Depois: persistência (SQLite no dev, Postgres no deploy), integração com o front, WebSocket e IA (`POST /api/ai/command`, sempre com confirmação do usuário).