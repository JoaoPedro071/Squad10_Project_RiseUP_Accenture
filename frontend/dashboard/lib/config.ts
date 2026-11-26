// Endereços configuráveis em .env.local (modelo em .env.example).
// NEXT_PUBLIC_ = disponível também no navegador.

/** Backend FastAPI. */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Mesmo backend, pelo WebSocket (http -> ws, https -> wss). */
export const WS_URL = API_URL.replace(/^http/, "ws");

/** Nome do cookie de sessão criado pelo backend no login. */
export const SESSION_COOKIE = "em_session";

/** Player (client-app), usado nos links "abrir tela". */
export const CLIENT_APP_URL =
  process.env.NEXT_PUBLIC_CLIENT_APP_URL ?? "http://localhost:3001";

/** Endereço da página de login. next = página para voltar depois de entrar. */
export function loginUrl(next?: string): string {
  const url = new URL("/login", window.location.origin);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}