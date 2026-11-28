# Backend: Experience Manager API (FastAPI)

API que guarda o estado das telas e do catálogo, valida cada ação e informa a cada tela (player) o que exibir. Os dados ficam em um banco (SQLite por padrão) e o sinal de vida fica em memória. O dashboard usa login com dois perfis. Rode com um único worker.

## Rodar

Requer o [uv](https://docs.astral.sh/uv/). Ele usa o Python 3.12 (`.python-version`) e o baixa se faltar.

```bash
uv sync                                         # cria o .venv e instala tudo
uv run python manage.py create-user --email voce@exemplo.com --name "Seu Nome" --role coordination
uv run uvicorn main:app --reload --port 8000
uv run pytest                                   # 132 testes
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
| `DATABASE_URL` | `sqlite:///./experience-manager.db` | Banco de dados. Para Postgres, basta trocar a URL |
| `SESSION_HOURS` | `12` | Horas até a sessão de login expirar |
| `COOKIE_SECURE` | `false` | `true` = cookie de sessão só por HTTPS (sempre ligado em `production`) |

Se o front for aberto por outro endereço (IP da máquina, outra porta), acrescente-o em `CORS_ORIGINS`.

### Banco de dados

- Na primeira vez que a API sobe, ela cria o arquivo `experience-manager.db` (fora do Git) e grava os dados iniciais. Nas próximas vezes, mantém o que já existe.
- **No banco:** experiências, imagens, telas (posição, trava e conteúdo), stand-by, Modo foco, usuários e sessões de login.
- **Em memória:** o sinal de vida. Ao reiniciar a API, as telas aparecem *Desligadas* até o próximo aviso (em até 5 s) e voltam ao mesmo conteúdo.
- **Voltar aos dados iniciais:** pare a API, apague `experience-manager.db` e suba de novo.
- Os testes usam um banco em memória e não mexem nesse arquivo.

## Login e perfis

- **Usuários:** criados pelo terminal, não há cadastro aberto:
  `uv run python manage.py create-user --email ana@exemplo.com --name "Ana" --role coordination`
  (a senha é pedida duas vezes, sem aparecer; mínimo de 8 caracteres).
- **Perfis:** `coordination` (Coordenação) pode tudo. `support` (Apoio) vê tudo, troca conteúdo, usa o Modo foco e identifica telas, mas não mexe no catálogo, no stand-by, nas posições nem no cadastro de telas (recebe 403).
- **Sessão:** o login devolve um cookie `em_session` (`HttpOnly`, `SameSite=Lax`, `Secure` em produção) que vale `SESSION_HOURS`. No banco fica só o hash do token.
  - "Sair" apaga a sessão na hora e fecha o `/ws/dashboard` daquela sessão (código 4401).
  - Sessão expirada: o `/ws/dashboard` dela fecha em até 2 s (4401).
  - A cada login, as sessões vencidas são apagadas do banco.
- **Senhas:** guardadas com hash argon2. A mensagem de erro é a mesma para e-mail inexistente e senha errada; depois de 5 tentativas erradas em 1 minuto, responde 429.
- **Rotas abertas:** player (`GET /display`, `POST /heartbeat`, `/ws/player`), `GET /api/health` e o próprio login. Elas passam a exigir o token da tela no pareamento.
- **Deploy:** o dashboard (servidor Next) repassa o cookie ao backend, então os dois precisam do mesmo domínio-base (ex.: `app.exemplo.com` e `api.exemplo.com`); isso será configurado na trilha de deploy.

## Conceitos

**Tela (`Client`).** O que ela exibe é escolhido pelo operador; o estado e a orientação são calculados pelo backend.

| Campo | Quem define | Significado |
|---|---|---|
| `id`, `name` | Cadastro (Coordenação) | Identificação. O `id` é gerado (`cli-` + 8 caracteres); o nome aparece no mapa |
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
| 5 | `standby` | Disponível | Ligada, sem conteúdo (exibe a imagem de stand-by) |

Conteúdo com orientação `any` e o stand-by nunca geram erro de orientação.

**Experiência:** `id, title, description, url, type ("web"), orientation ("landscape" | "portrait" | "any"), active`. Inativar não apaga: só impede novas atribuições, e quem já exibe continua até ser trocado.

**Imagem:** `id, title, description, url, orientation, active`. Inativar não apaga: só impede novas atribuições, e quem já exibe continua até ser trocado.

**Configurações:** `standbyImageId`, a imagem exibida pelas telas sem conteúdo (`null` = tela preta). A imagem de stand-by não pode ser inativada.

**Modo foco:** uma camada por cima das atribuições. A tela em foco segue exibindo o seu conteúdo e todas as outras ficam *Em pausa*. Nada é alterado: conteúdo trocado durante o foco aparece ao sair dele, e uma tela que reconecta durante o foco volta pausada.

## Contrato (JSON em camelCase)

Quem pode: **Login** = qualquer pessoa logada; **Coord.** = só Coordenação; **Aberta** = sem login. Sem sessão: 401 `{"error": "Faça login para continuar."}`; perfil sem permissão: 403 `{"error": "Seu perfil não permite esta ação."}`.

| Rota | Quem pode | Corpo | Sucesso | Erros |
|---|---|---|---|---|
| `POST /api/auth/login` | Aberta | `{email, password}` | `User` + cookie | 401, 422, 429 |
| `POST /api/auth/logout` | Aberta | n/a | 204 | n/a |
| `GET /api/auth/me` | Login | n/a | `User` | 401 |
| `GET /api/experiences` | Login | n/a | `Experience[]` | n/a |
| `POST /api/experiences` | Coord. | title, description, url, type, orientation | 201 `Experience` | 400 `{fieldErrors}` |
| `PUT /api/experiences/{id}` | Coord. | mesmos campos do cadastro | `Experience` | 400 `{fieldErrors}`, 404 |
| `PUT /api/experiences/{id}/active` | Coord. | `{active: bool}` | `Experience` | 422, 404 |
| `GET /api/images` | Login | n/a | `Image[]` | n/a |
| `POST /api/images` | Coord. | title, description, url, orientation | 201 `Image` | 400 `{fieldErrors}` |
| `PUT /api/images/{id}` | Coord. | mesmos campos do cadastro | `Image` | 400 `{fieldErrors}`, 404 |
| `PUT /api/images/{id}/active` | Coord. | `{active: bool}` | `Image` | 422, 404, 409 (é o stand-by atual) |
| `GET /api/settings` | Login | n/a | `{standbyImageId}` | n/a |
| `PUT /api/settings` | Coord. | `{standbyImageId: id \| null}` | `{standbyImageId}` | 422 (imagem inexistente ou inativa) |
| `GET /api/clients` | Login | n/a | `Client[]` | n/a |
| `POST /api/clients` | Coord. | `{name}` | 201 `Client` | 400 `{fieldErrors}` |
| `PUT /api/clients/{id}` | Coord. | `{name}` | `Client` | 400 `{fieldErrors}`, 404 |
| `DELETE /api/clients/{id}` | Coord. | n/a | 204 | 404, 409 (tela no Modo foco) |
| `PUT /api/clients/{id}/content` | Login | `{experienceId?, imgId?, displayImg?}` | `Client` | 422, 404 |
| `PUT /api/clients/{id}/position` | Coord. | `{x, y}` em % (0 a 100) | `Client` | 422, 403 (tela travada), 404 |
| `PUT /api/clients/{id}/lock` | Coord. | `{locked: bool}` | `Client` | 422, 404 |
| `GET /api/focus` | Login | n/a | `{focus, clients}` | n/a |
| `POST /api/focus` | Login | `{clientId}` | 201 `{focus, clients}` | 404, 422 (tela desligada), 409 (já ativo) |
| `DELETE /api/focus` | Login | n/a | `{focus: null, clients}` | n/a |
| `POST /api/clients/identify` | Login | n/a | `{seconds, numbers}` | n/a |
| `POST /api/clients/{id}/heartbeat` | Aberta (o player usa o WebSocket) | `{orientation, resolution?}` | 204 | 422, 404 |
| `GET /api/clients/{id}/display` | Aberta (o player usa o WebSocket) | n/a | `DisplayState` (`no-store`) | 404 |
| `GET /api/health` | Aberta | n/a | `{status: "ok"}` | n/a |

Formatos de erro: validação de cadastro devolve 400 `{"fieldErrors": {campo: mensagem}}`; os demais devolvem `{"error": "mensagem"}`, sempre em português.

`focus` é `null` ou `{clientId}`.

### Cadastro de telas (`POST`, `PUT` e `DELETE /api/clients`)

- **Nome:** obrigatório, até 60 caracteres e sem repetir o de outra tela (ignora maiúsculas e acentos). Erros em `fieldErrors.name`: "Informe o nome da tela.", "Use no máximo 60 caracteres no nome." ou "Já existe uma tela com este nome.".
- **Tela nova:** nasce no centro da planta (`x = 50`, `y = 50`), destravada e sem conteúdo.
- **Renomear:** mesmas regras do nome; manter o próprio nome (mesmo mudando maiúsculas) não conta como repetido.
- **Remover:** apaga a tela e o sinal de vida dela. Se o player estiver conectado, a conexão fecha com 4404 e ele mostra "Tela não cadastrada". A tela em foco não pode ser removida (409 "Esta tela está no Modo foco. Saia do Modo foco antes de removê-la.").

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

Pelo WebSocket (ou por esta rota), o player envia a cada ~5 s a orientação atual da máquina (`"landscape"` ou `"portrait"`, obrigatória) e, opcionalmente, a resolução (`"1920x1080"`). Responde 204, sem corpo.

### O que a tela exibe (`GET /api/clients/{id}/display`)

Prioridade: **Em pausa → imagem → experiência → stand-by**.

| Resposta | O player mostra |
|---|---|
| `{"kind": "paused"}` | Tela preta |
| `{"kind": "image", "image": Image}` | A imagem |
| `{"kind": "experience", "experience": Experience}` | A experiência |
| `{"kind": "standby", "image": Image \| null}` | A imagem de stand-by, ou preto se `null` |

Carregando, falha ao carregar o conteúdo e sem conexão são estados **locais** do player: não vêm daqui.

### Tempo real (WebSocket)

| Rota | Quem conecta | Recebe ao conectar e a cada mudança |
|---|---|---|
| `/ws/player/{clientId}` | Player (aberta) | `{"type": "display", "version": n, "state": DisplayState}` (tela desconhecida ou removida: fecha com código 4404) |
| `/ws/dashboard` | Dashboard (com login; sem sessão, logout ou sessão expirada: fecha com 4401) | `{"type": "state", "focus", "clients"}` |

O player envia pelo mesmo canal:

| Mensagem | Efeito |
|---|---|
| `{"type": "heartbeat", "orientation", "resolution?"}` (a cada ~5 s) | Sinal de vida, igual ao `POST /heartbeat` |
| `{"type": "ack", "version": n}` | Confirma que exibiu a mudança; o dashboard recebe `{"type": "ack", "clientId", "version"}` e mostra "Concluído" |

- Toda alteração bem-sucedida (`POST`, `PUT` ou `DELETE` em `/api`) avisa as telas afetadas e o dashboard. A tela que teve o conteúdo trocado sempre recebe o aviso, para poder confirmar.
- Uma checagem a cada 2 s avisa o dashboard quando uma tela passa do tempo limite sem sinal de vida e fecha as conexões do dashboard com sessão vencida.
- `POST /api/clients/identify`: cada tela conectada recebe `{"type": "identify", "number", "name", "seconds"}` e mostra o número por 10 s; o dashboard recebe `{"type": "identify", "numbers", "seconds"}`.
- A origem da conexão é conferida com `CORS_ORIGINS` (o navegador não aplica CORS a WebSocket).
- As conexões ficam na memória do processo: rode com **um único worker**.

## Guia de integração do front

O dashboard e o player já usam esta API. Referência do que mudou em relação aos mocks antigos do front:

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
| (não existia) | Player conecta ao WebSocket: recebe o conteúdo, envia o sinal de vida e confirma cada mudança |

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

Rótulos usados na interface: `busy` Em uso · `standby` Disponível · `paused` Em pausa · `error` Erro · `off` Desligada (sempre com ícone e texto, nunca só cor).

## Estrutura

```
pyproject.toml     dependências (uv) e configuração do pytest
uv.lock            versões exatas das dependências (gerado pelo uv)
main.py            app, CORS, routers e aviso em tempo real após cada alteração
manage.py          comandos de terminal (create-user)
dependencies.py    quem está logado e o que o perfil pode fazer
config.py          variáveis de ambiente (APP_ENV, CORS_ORIGINS, HEARTBEAT_TIMEOUT_SECONDS, DATABASE_URL, SESSION_HOURS, COOKIE_SECURE)
errors.py          formatos de erro que o front espera
routers/           auth.py (login), experiences.py, images.py, settings.py, clients.py (telas), focus.py, ws.py (WebSocket)
schemas/           formatos dos dados (Pydantic, JSON em camelCase)
db/                conexão e tabelas do banco (SQLAlchemy)
models/            store (banco + sinal de vida em memória) e seed
services/          validation.py, realtime.py (conexões WebSocket), auth.py (senhas, tokens e limite de tentativas) e ai_service.py no futuro
tests/             pytest
```

Observação: o documento de arquitetura previa `monitors.py` e `assignments.py`. Como o front chama a tela de `client` e usa `/api/clients/...`, ficou tudo em `routers/clients.py`.

## Próximos passos

1. Postgres no deploy (trocar `DATABASE_URL`) e migrações com Alembic.
2. Pareamento das telas por código, com token por tela (substitui o `?client=` e fecha as rotas do player).
3. Tela de gestão de usuários no dashboard (hoje, só pelo `manage.py`).
4. IA: `POST /api/ai/command`, sempre com prévia e confirmação do usuário.