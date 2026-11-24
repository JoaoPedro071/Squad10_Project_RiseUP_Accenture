# Player: Experience Manager

Página exibida em cada tela (Next.js, porta 3001). Mostra o que o backend manda e avisa que a tela está ligada.

## Rodar

Com o backend rodando (`backend/`, porta 8000):

```bash
cp .env.example .env.local      # Windows (PowerShell): Copy-Item .env.example .env.local
npm install
npm run dev                     # http://localhost:3001/?client=cli-1
```

| Variável (`.env.local`) | Padrão | Para que serve |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Endereço do backend |

Cada tela abre o player com o seu id: `http://<player>/?client=<id da tela>`. Em produção, use o navegador em tela cheia (modo quiosque) com um perfil persistente.

## Como funciona

- A cada **1,5 s** consulta `GET /api/clients/{id}/display` e exibe: experiência, imagem, stand-by (imagem global ou preto) ou pausa (preto).
- A cada **5 s** envia `POST /api/clients/{id}/heartbeat` com a orientação e a resolução da tela. Sem aviso por 15 s, o dashboard mostra a tela como *Desligada*.
- Sem conexão, mantém o que está na tela e tenta de novo. Avisos próprios: "Conectando...", "Tela não identificada" (sem `?client=`) e "Tela não cadastrada" (id desconhecido).
- Sem elementos interativos e sem cursor.

## Verificar

```bash
npm run lint
npm run build
```