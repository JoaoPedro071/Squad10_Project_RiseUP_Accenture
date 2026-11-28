# Dashboard: Experience Manager

Painel do operador (Next.js, porta 3000). Lê e altera tudo pelo backend FastAPI.

## Rodar

Com o backend rodando (`backend/`, porta 8000):

```bash
cp .env.example .env.local      # Windows (PowerShell): Copy-Item .env.example .env.local
npm install
npm run dev                     # http://localhost:3000
```

| Variável (`.env.local`) | Padrão | Para que serve |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Endereço do backend |
| `NEXT_PUBLIC_CLIENT_APP_URL` | `http://localhost:3001` | Endereço do player (links "Abrir tela") |

Se o dashboard for aberto por outro endereço, inclua-o em `CORS_ORIGINS` no backend.

## Páginas

| Rota | O que faz |
|---|---|
| `/` | Planta: status das telas, troca de conteúdo, Modo foco, mover e travar posição |
| `/clients` | As mesmas telas em lista |
| `/experiences`, `/experiences/new`, `/experiences/[id]/edit` | Catálogo de experiências: filtro Ativas/Inativas, setores e tags, editar (com confirmação se estiver em uso) e inativar |
| `/images`, `/images/new`, `/images/[id]/edit` | Catálogo de imagens: cadastrar (sugere a orientação pela proporção), editar e inativar |
| `/settings` | Imagem de stand-by |

Planta e lista recebem as mudanças em tempo real (WebSocket `/ws/dashboard`). Sem conexão, aparece "Sem conexão em tempo real" e o dashboard tenta reconectar sozinho. Ao trocar o conteúdo de uma tela, "Concluído" só aparece quando a tela confirma; sem confirmação em 5 s, um aviso pede para conferir a tela. O botão "Identificar telas" mostra o número de cada tela por 10 s. Com o backend fora do ar ao abrir a página, aparece uma tela de erro com "Tentar novamente".

## Estrutura

```
app/            páginas (carregam os dados do backend no servidor)
components/     telas e modais
hooks/useBoard  estado e ações das telas (planta e lista) e conexão WebSocket
services/api.ts todas as chamadas ao backend
lib/            config, rótulos de status e orientação, validação dos formulários
types/api.ts    contrato do backend
```

## Verificar

```bash
npm run lint
npm run build
```