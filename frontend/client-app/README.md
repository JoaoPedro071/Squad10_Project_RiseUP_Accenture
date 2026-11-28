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

- Conecta ao WebSocket `/ws/player/{id}` e exibe na hora o que receber: experiência, imagem, stand-by (imagem global ou preto) ou pausa (preto).
- A cada **5 s** (e ao girar ou redimensionar a tela) envia o sinal de vida com a orientação e a resolução. Sem aviso por 15 s, o dashboard mostra a tela como *Desligada*.
- Confirma cada mudança depois de exibi-la; é isso que faz o dashboard mostrar "Concluído".
- Modo de identificação: mostra o número e o nome da tela por cima do conteúdo por 10 s.
- Sem conexão, mantém o que está na tela, mostra "Reconectando..." no canto e tenta de novo com espera crescente (1 s até 30 s). Avisos próprios: "Conectando...", "Tela não identificada" (sem `?client=`) e "Tela não cadastrada" (id desconhecido, ou tela removida no painel enquanto o player estava aberto).
- Sem elementos interativos e sem cursor.
- Visual da marca Accenture: fundo preto, símbolo ">" oficial nas telas de aviso e Arial (para trocar pela Graphik, mude só `--font-brand` em `app/globals.css`). Animações desligadas para quem prefere menos movimento.

## Verificar

```bash
npm run lint
npm run build
```