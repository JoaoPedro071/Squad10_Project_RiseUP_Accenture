# Experience Manager: Innovation Center Accenture

Sistema web para gerenciar, de forma centralizada, o conteúdo exibido nas telas do Innovation Center da Accenture. Projeto da Squad 10, Rise-Up 2026.2 (Porto Digital).

## O problema

Hoje cada tela é configurada na mão, uma por uma. O Experience Manager permite escolher uma experiência e enviá-la para uma ou várias telas a partir de um painel. A evolução prevista é configurar as telas com comandos em linguagem natural (IA), sempre com confirmação do usuário antes de qualquer ação.

## Como funciona

```mermaid
flowchart LR
    D["Dashboard (Next.js)"] -->|"REST"| A["API (FastAPI)"]
    P["Player (Next.js, um por tela)"] -->|"consulta o que exibir"| A
    A -.->|"planejado"| G["Gemini Flash (IA)"]
```

- **Dashboard:** o operador vê a planta do espaço, escolhe o que cada tela exibe (experiência, imagem ou stand-by), trava a posição e usa o Modo foco (uma tela apresenta e as outras ficam em pausa).
- **API:** guarda o estado, valida cada ação e informa ao player o que exibir.
- **Player:** página aberta em cada tela. Envia um sinal de vida com a orientação da máquina e consulta periodicamente o que exibir; o WebSocket é uma próxima etapa.

## Estrutura do repositório

```
backend/               API em FastAPI (Python)
frontend/dashboard/    painel de gerenciamento (Next.js, porta 3000)
frontend/client-app/   player exibido em cada tela (Next.js, porta 3001)
```

## Como rodar

### Back-end (uv)

Instale o [uv](https://docs.astral.sh/uv/) uma vez; ele cuida do Python (3.12) e das dependências.

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
uv run pytest                    # 70 testes
```

Documentação interativa da API: http://localhost:8000/docs

### Front-end (Node 20 ou superior)

```bash
cd frontend/dashboard
npm install
npm run dev                      # http://localhost:3000
```

```bash
cd frontend/client-app
npm install
npm run dev                      # http://localhost:3001
```

Enquanto a integração não é concluída, o dashboard e o player usam rotas simuladas internas, com o contrato antigo. O que muda na troca está no [guia de integração](backend/README.md#guia-de-integração-do-front).

## API em resumo

| Rota | O que faz |
|---|---|
| `GET /api/experiences` | lista o catálogo |
| `POST /api/experiences` | cria uma experiência (com validação) |
| `GET/POST /api/images` | lista e cadastra imagens |
| `PUT /api/images/{id}/active` | ativa ou inativa uma imagem |
| `GET/PUT /api/settings` | consulta e escolhe a imagem de stand-by |
| `GET /api/clients` | lista as telas |
| `PUT /api/clients/{id}/content` | define o que a tela exibe: experiência, imagem ou nada |
| `POST /api/clients/{id}/heartbeat` | sinal de vida da tela, com orientação e resolução |
| `GET /api/clients/{id}/display` | o que o player deve exibir agora |
| `PUT /api/clients/{id}/position` | move a tela na planta |
| `PUT /api/clients/{id}/lock` | trava ou destrava a posição |
| `GET/POST/DELETE /api/focus` | consulta, inicia e encerra o Modo foco |

Detalhes e formatos de erro em [`backend/README.md`](backend/README.md).

## Status

- [x] Dashboard com planta, trava de posição e Modo foco (com API simulada)
- [x] Back-end, fatia 1: contrato do front e 24 testes
- [x] Back-end: novo modelo de tela, catálogo de imagens, stand-by global e atribuição de conteúdo
- [x] Back-end: sinal de vida, 5 estados, aviso de orientação, Modo foco como camada e CORS restrito (70 testes)
- [ ] Integração entre front-end e back-end
- [ ] Persistência em banco de dados
- [ ] Tempo real com WebSocket
- [ ] Deploy na AWS com custo zero
- [ ] Assistente de IA com confirmação do usuário
- [ ] Telas reais: planta do espaço e design system da Accenture

## Decisões de projeto

- **Custo zero:** IA com Gemini Flash (free tier) e hospedagem no free tier da AWS.
- **IA só propõe:** o usuário confirma e o back-end valida antes de executar qualquer ação.
- **Telas:** hipótese de uma máquina Linux leve por tela abrindo o player em modo quiosque, em validação com os mentores.

## Fluxo de trabalho

- `main` é a branch estável e padrão.
- O trabalho acontece em branches `feat/...`, `fix/...` ou `docs/...`.
- Toda mudança entra na `main` por Pull Request, com pelo menos uma revisão.
- Mensagens de commit no padrão `feat`, `fix`, `chore` e `docs`.
