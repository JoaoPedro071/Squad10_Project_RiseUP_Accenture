# Backend: Experience Manager API (FastAPI)

API que guarda o estado das telas e do catálogo, valida cada ação e informa a cada tela (player) o que exibir. Estado em memória (reinicia ao subir) e um único worker.

## Rodar

Requer o [uv](https://docs.astral.sh/uv/). Ele usa o Python 3.12 (`.python-version`) e o baixa se faltar.

```bash
uv sync                                         # cria o .venv e instala tudo
uv run uvicorn main:app --reload --port 8000
uv run pytest                                   # 70 testes
```

Dependências: `uv add <pacote>` (app) ou `uv add --dev <pacote>` (só desenvolvimento). Sempre commite o `pyproject.toml` junto com o `uv.lock`.

Docs interativas: http://localhost:8000/docs

> No VS Code, selecione o interpretador do `.venv` (`Ctrl+Shift+P` → *Python: Select Interpreter*); senão o editor acusa imports não resolvidos.

### Variáveis de ambiente

Copie `env.example` para `.env` (o `.env` nunca deve ser commitado).

| Variável | Padrão | Para que serve |
|---|---|---|
| `APP_ENV` | `development` | `production` ativa as checagens de produção |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Sites (dashboard e player) que podem chamar a API. `*` libera tudo e é **recusado** em `production` |
| `HEARTBEAT_TIMEOUT_SECONDS` | `15` | Segundos sem sinal de vida até a tela ficar *Desligada* |

Se o front for aberto por outro endereço (IP da máquina, outra porta), acrescente-o em `CORS_ORIGINS`.

## Conceitos

**Tela (`Client`).** O que ela exibe é escolhido pelo operador; o estado e a orientação são calculados pelo backend.

| Campo | Quem define | Significado |
|---|---|---|
| `id`, `name` | Cadastro | Identificação. O nome aparece no mapa |
| `currentExperienceId` | Operador | Experiência atribuída (ou `null`) |
| `imgId` | Operador | Imagem atribuída (ou `null`) |
| `displayImg` | Operador | `true` = exibe a imagem no lugar da experiência, sem perder nenhuma das duas |
| `reportedOrientation`, `reportedResolution`, `lastSeenAt` | A própria tela (sinal de vida) | `null` até a tela se comunicar |
| `status` | Backend | Um dos 5 estados abaixo |
| `orientationMismatch` | Backend | `true` = a orientação da tela não combina com o conteúdo exibido (ícone de erro de configuração) |
| `x`, `y`, `locked` | Operador | Posição na planta, em % (0 a 100), e trava de posição |

**Os 5 estados (`status`).** Quando duas situações coincidem, vale a primeira da lista.

| Prioridade | Código | Rótulo | Quando |
|---|---|---|---|
| 1 | `off` | Desligada | Sem sinal de vida há mais de `HEARTBEAT_TIMEOUT_SECONDS`. A atribuição fica guardada e volta quando a tela reconecta |
| 2 | `paused` | Em pausa | Modo foco ativo e esta não é a tela em foco |
| 3 | `error` | Erro | Orientação da tela ≠ orientação do conteúdo exibido |
| 4 | `busy` | Em uso | Exibe uma experiência ou imagem |
| 5 | `standby` | Stand-by | Ligada, sem conteúdo |

Conteúdo com orientação `any` e o stand-by nunca geram erro de orientação.

**Experiência:** `id, title, description, url, type ("web"), orientation ("landscape" | "portrait" | "any"), active`.

**Imagem:** `id, title, description, url, orientation, active`. Inativar não apaga: só impede novas atribuições, e quem já exibe continua até ser trocado.

**Configurações:** `standbyImageId`, a imagem exibida pelas telas sem conteúdo (`null` = tela preta). A imagem de stand-by não pode ser inativada.

**Modo foco:** uma camada por cima das atribuições. A tela em foco segue exibindo o seu conteúdo e todas as outras ficam *Em pausa*. Nada é alterado: conteúdo trocado durante o foco aparece ao sair dele, e uma tela que reconecta durante o foco volta pausada.

## Contrato (JSON em camelCase)

| Rota | Quem chama | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `GET /api/experiences` | Dashboard | n/a | `Experience[]` | n/a |
| `POST /api/experiences` | Dashboard | title, description, url, type, orientation | 201 `Experience` | 400 `{fieldErrors}` |
| `GET /api/images` | Dashboard | n/a | `Image[]` | n/a |
| `POST /api/images` | Dashboard | title, description, url, orientation | 201 `Image` | 400 `{fieldErrors}` |
| `PUT /api/images/{id}/active` | Dashboard | `{active: bool}` | `Image` | 422, 404, 409 (é o stand-by atual) |
| `GET /api/settings` | Dashboard | n/a | `{standbyImageId}` | n/a |
| `PUT /api/settings` | Dashboard | `{standbyImageId: id \| null}` | `{standbyImageId}` | 422 (imagem inexistente ou inativa) |
| `GET /api/clients` | Dashboard | n/a | `Client[]` | n/a |
| `PUT /api/clients/{id}/content` | Dashboard | `{experienceId?, imgId?, displayImg?}` | `Client` | 422, 404 |
| `PUT /api/clients/{id}/position` | Dashboard | `{x, y}` em % (0 a 100) | `Client` | 422, 403 (tela travada), 404 |
| `PUT /api/clients/{id}/lock` | Dashboard | `{locked: bool}` | `Client` | 422, 404 |
| `GET /api/focus` | Dashboard | n/a | `{focus, clients}` | n/a |
| `POST /api/focus` | Dashboard | `{clientId}` | 201 `{focus, clients}` | 404, 422 (tela desligada), 409 (já ativo) |
| `DELETE /api/focus` | Dashboard | n/a | `{focus: null, clients}` | n/a |
| `POST /api/clients/{id}/heartbeat` | Player, a cada ~5 s | `{orientation, resolution?}` | 204 | 422, 404 |
| `GET /api/clients/{id}/display` | Player, a cada ~1,5 s | n/a | `DisplayState` (`no-store`) | 404 |
| `GET /api/health` | Monitoramento | n/a | `{status: "ok"}` | n/a |

Formatos de erro: validação de cadastro devolve 400 `{"fieldErrors": {campo: mensagem}}`; os demais devolvem `{"error": "mensagem"}`, sempre em português.

`focus` é `null` ou `{clientId}`.

### Conteúdo da tela (`PUT /api/clients/{id}/content`)

Só os campos **enviados** mudam; `null` remove.

| Envio | Efeito |
|---|---|
| `{"experienceId": "exp-2"}` | Passa a exibir a experiência (`displayImg` vira `false`) |
| `{"imgId": "img-1"}` | Passa a exibir a imagem (`displayImg` vira `true`); a experiência fica guardada |
| `{"displayImg": false}` | Alterna para a experiência guardada (`true` volta para a imagem) |
| `{"experienceId": null}` / `{"imgId": null}` | Remove a experiência / a imagem |

Só aceita itens existentes e ativos, recusa `displayImg: true` sem imagem e é **tudo ou nada**: se qualquer campo for inválido, nada é gravado. A resposta traz o `status` real: `off` significa "será exibido quando a tela voltar"; `paused`, "será exibido ao sair do Modo foco".

### Sinal de vida (`POST /api/clients/{id}/heartbeat`)

O player envia a cada ~5 s a orientação atual da máquina (`"landscape"` ou `"portrait"`, obrigatória) e, opcionalmente, a resolução (`"1920x1080"`). Responde 204, sem corpo.

### O que a tela exibe (`GET /api/clients/{id}/display`)

Prioridade: **Em pausa → imagem → experiência → stand-by**.

| Resposta | O player mostra |
|---|---|
| `{"kind": "paused"}` | Tela preta |
| `{"kind": "image", "image": Image}` | A imagem |
| `{"kind": "experience", "experience": Experience}` | A experiência |
| `{"kind": "standby", "image": Image \| null}` | A imagem de stand-by, ou preto se `null` |

Carregando, falha ao carregar o conteúdo e sem conexão são estados **locais** do player: não vêm daqui.

## Guia de integração do front

O dashboard e o player ainda usam os mocks internos do Next com o contrato antigo. Ao trocar para esta API:

| Antes (mocks) | Agora (API) |
|---|---|
| `PUT /api/clients/{id}/assignment` `{experienceId}` | `PUT /api/clients/{id}/content` `{experienceId}` |
| `PUT /api/clients/{id}/display` `{displayOff}` (liga/desliga) | Removido. Sem conteúdo = stand-by |
| `Client.room` | Removido (o mapa já mostra o local) |
| `Client.orientation` | `Client.reportedOrientation` (informada pela tela) |
| `Client.status: "online" \| "offline"` | `Client.status`: 5 estados (tabela acima) |
| `Client.displayOff` | Removido. Pausa vem do Modo foco (`status: "paused"`) |
| `FocusState.affectedIds`, `offlineIds` | Removidos. `focus` é só `{clientId}` |
| Display `showing` | `experience` |
| Display `off` | `paused` |
| Display `waiting` | `standby` (com `image` ou `null`) |
| Display `error` | Removido da API; continua como estado local do player |
| Experiência `type: "image"` | Imagens têm catálogo próprio (`/api/images`) |
| (não existia) | Player envia `POST /heartbeat` a cada ~5 s |

Tipos TypeScript equivalentes:

```ts
export type ScreenStatus = "busy" | "standby" | "paused" | "error" | "off";
export type Orientation = "landscape" | "portrait";
export type ContentOrientation = Orientation | "any";

export type Experience = {
  id: string; title: string; description: string; url: string;
  type: "web"; orientation: ContentOrientation; active: boolean;
};

export type Image = {
  id: string; title: string; description: string; url: string;
  orientation: ContentOrientation; active: boolean;
};

export type Client = {
  id: string; name: string;
  status: ScreenStatus; orientationMismatch: boolean;
  currentExperienceId: string | null; imgId: string | null; displayImg: boolean;
  reportedOrientation: Orientation | null; reportedResolution: string | null;
  lastSeenAt: string | null; // ISO 8601
  x: number; y: number; locked: boolean;
};

export type DisplayState =
  | { kind: "paused" }
  | { kind: "image"; image: Image }
  | { kind: "experience"; experience: Experience }
  | { kind: "standby"; image: Image | null };

export type FocusState = { clientId: string };
export type Settings = { standbyImageId: string | null };
```

Rótulos sugeridos para a interface: `busy` Em uso · `standby` Stand-by · `paused` Em pausa · `error` Erro · `off` Desligada (sempre com ícone e texto, nunca só cor).

## Estrutura

```
pyproject.toml     dependências (uv) e configuração do pytest
uv.lock            versões exatas das dependências (gerado pelo uv)
main.py            app, CORS e routers
config.py          variáveis de ambiente (APP_ENV, CORS_ORIGINS, HEARTBEAT_TIMEOUT_SECONDS)
errors.py          formatos de erro que o front espera
routers/           experiences.py, images.py, settings.py, clients.py (telas), focus.py
schemas/           formatos dos dados (Pydantic, JSON em camelCase)
models/            store em memória + seed (vira banco de dados depois)
services/          validation.py (e ai_service.py no futuro)
tests/             pytest
```

Observação: o documento de arquitetura previa `monitors.py` e `assignments.py`. Como o front chama a tela de `client` e usa `/api/clients/...`, ficou tudo em `routers/clients.py`.

## Próximos passos

1. Integração do dashboard e do player com esta API (guia acima).
2. Persistência (SQLite no dev, Postgres no deploy), mantendo a interface de `models/store.py`.
3. Pareamento das telas por código e modo de identificação.
4. WebSocket no lugar do polling do player.
5. IA: `POST /api/ai/command`, sempre com prévia e confirmação do usuário.