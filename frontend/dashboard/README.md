# Dashboard: Experience Manager

Painel do operador (Next.js, porta 3000). Lê e altera tudo pelo backend FastAPI. Exige login.

## Rodar

Com o backend rodando (`backend/`, porta 8000) e um usuário criado (`uv run python manage.py create-user ...` no `backend/`):

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

## Login e perfis

- Sem sessão, qualquer página leva a `/login` (`proxy.ts`) e, depois de entrar, volta para a página pedida.
- O backend grava um cookie `HttpOnly`; o dashboard nunca lê o token. As páginas do servidor repassam o cookie ao backend (`services/session.ts`), e as chamadas do navegador usam `credentials: "include"`.
- Sessão expirada no meio do uso (401 ou WebSocket fechado com 4401): volta para o login.
- O menu mostra o nome, o perfil e **Sair**.
- **Apoio** não vê Configurações, Editar posições, Nova experiência/imagem, Editar/Inativar, Nova tela nem a seção "Gerenciar tela"; se abrir essas páginas pelo endereço, vê "Sem permissão". O backend recusa de qualquer forma (403).

## Páginas

| Rota | O que faz |
|---|---|
| `/login` | Entrar (e-mail e senha) |
| `/` | Planta: status das telas, troca de conteúdo, Modo foco, mover e travar posição |
| `/clients` | Telas em lista: métricas em tempo real (cadastradas, conectadas, em uso, com erro), busca por nome, filtro por estado e cards que abrem os detalhes. Coordenação: "Nova tela" (mostra o endereço do player com "Copiar") |
| `/experiences`, `/experiences/new`, `/experiences/[id]/edit` | Catálogo de experiências: filtro Ativas/Inativas, busca por título e descrição (ignora acentos) dentro da aba, editar (com confirmação se estiver em uso) e inativar |
| `/images`, `/images/new`, `/images/[id]/edit` | Catálogo de imagens: cadastrar (sugere a orientação pela proporção), editar e inativar |
| `/settings` | Imagem de stand-by (só Coordenação) |

Planta e lista recebem as mudanças em tempo real (WebSocket `/ws/dashboard`). Sem conexão, aparece "Sem conexão em tempo real" e o dashboard tenta reconectar sozinho. Ao trocar o conteúdo de uma tela, "Concluído" só aparece quando a tela confirma; sem confirmação em 5 s, um aviso pede para conferir a tela. O botão "Identificar telas" mostra o número de cada tela por 10 s.

Os detalhes da tela (pela planta ou pela lista) têm, só para Coordenação, a seção "Gerenciar tela": copiar o endereço do player, renomear e remover (com confirmação; a tela em Modo foco não pode ser removida). Criar, renomear e remover aparecem na hora para todos, pelo WebSocket.

Com o backend fora do ar ao abrir a página, aparece uma tela de erro com "Tentar novamente".

## Marca Accenture

- **Cores e fonte:** todas em `app/globals.css` (paleta oficial, modo escuro, sem azul). A fonte é Arial; para trocar pela Graphik, mude só `--font-brand`.
- **Estilos compartilhados:** `lib/ui.ts` (botões, campos, cards, etiquetas, modais). Use esses nomes em vez de repetir classes.
- **Layout:** cabeçalho e páginas usam a mesma coluna (`ui.container`), então o logo e os títulos ficam alinhados. Toda página usa o `PageHeader` (título, subtítulo e ações). Nos cards com botões, o rodapé fica colado embaixo (`ui.cardFrame` e `ui.cardFooter`), na mesma altura em toda a linha.
- **Ícones:** [lucide](https://lucide.dev). Os dos estados ficam em `lib/status.ts`.
- **Estados das telas:** sempre ícone + texto + cor (`StatusBadge`, `StatusLegend`): Em uso, Disponível, Em pausa, Erro e Desligada.
- **Logo provisório:** símbolo ">" oficial + "Experience Manager" (`components/BrandMark.tsx`). O logo completo entra quando houver a versão para fundo escuro.
- **Acessibilidade:** contraste AA em todos os textos, foco visível, alvos de toque com 44 px e animações desligadas para quem prefere menos movimento.

## Estrutura

```
app/            páginas (carregam os dados do backend no servidor)
components/     telas, modais e peças reutilizáveis (Notice, FieldError, StatePage, BackLink, PageHeader,
                MetricCard, ClientFormModal, ConfirmModal, PlayerAddress...)
hooks/useBoard  estado e ações das telas (planta e lista) e conexão WebSocket
hooks/useCopy   copiar texto ("Copiado" por 2 s; se o navegador bloquear, seleciona para Ctrl+C)
services/api.ts todas as chamadas ao backend
services/session.ts  sessão nas páginas do servidor (cookie, usuário logado)
proxy.ts        manda para o login quem não tem sessão
lib/            config, permissões, estilos (ui.ts), estados e orientação, validação dos formulários,
                busca sem acentos (search.ts)
types/api.ts    contrato do backend
```

## Verificar

```bash
npm run lint
npm run build
```