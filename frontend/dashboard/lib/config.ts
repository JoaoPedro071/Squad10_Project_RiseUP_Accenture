// Endereços configuráveis em .env.local (modelo em .env.example).
// NEXT_PUBLIC_ = disponível também no navegador.

/** Backend FastAPI. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Mesmo backend, pelo WebSocket (http -> ws, https -> wss). */
export const WS_URL = API_URL.replace(/^http/, "ws");

/** Player (client-app), usado nos links "abrir tela". */
export const CLIENT_APP_URL =
  process.env.NEXT_PUBLIC_CLIENT_APP_URL ?? "http://localhost:3001";