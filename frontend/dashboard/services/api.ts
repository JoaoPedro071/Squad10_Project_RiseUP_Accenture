// Chamadas ao backend FastAPI. Funciona no navegador e nas páginas do servidor.
import { API_URL, loginUrl } from "@/lib/config";
import type { ExperienceInput, ImageInput } from "@/lib/validation";
import type {
  Client,
  ContentUpdate,
  Experience,
  FieldErrors,
  FocusResponse,
  Image,
  Settings,
  User,
} from "@/types/api";

/** Erro de cadastro (400): mensagens por campo, em português. */
export class ValidationError extends Error {
  fieldErrors: FieldErrors;

  constructor(fieldErrors: FieldErrors) {
    super("Dados inválidos");
    this.fieldErrors = fieldErrors;
  }
}

/** Demais erros: a mensagem vem do backend, em português. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * cookie: só nas páginas do servidor (services/session.ts), que repassam o
 * cookie de sessão do navegador. No navegador, o cookie vai sozinho.
 */
async function request<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
  cookie?: string,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(`${API_URL}${path}`, {
    method,
    cache: "no-store",
    credentials: "include", // envia o cookie de sessão
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return undefined as T;

  // Sessão expirou no meio do uso: volta para o login.
  if (
    response.status === 401 &&
    typeof window !== "undefined" &&
    !path.startsWith("/api/auth/")
  ) {
    // Recarga completa (limpa o estado da página antiga).
    window.location.assign(loginUrl(window.location.pathname));
  }

  const data = await response.json().catch(() => null);
  if (response.status === 400 && data?.fieldErrors) {
    throw new ValidationError(data.fieldErrors);
  }
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? "Falha na requisição");
  }
  return data as T;
}

// --- login ---
export const login = (email: string, password: string) =>
  request<User>("/api/auth/login", "POST", { email, password });

export const logout = () => request<void>("/api/auth/logout", "POST");

export const fetchMe = (cookie?: string) =>
  request<User>("/api/auth/me", "GET", undefined, cookie);

// --- leitura (cookie: só nas páginas do servidor) ---
export const fetchExperiences = (cookie?: string) =>
  request<Experience[]>("/api/experiences", "GET", undefined, cookie);
export const fetchImages = (cookie?: string) =>
  request<Image[]>("/api/images", "GET", undefined, cookie);
export const fetchSettings = (cookie?: string) =>
  request<Settings>("/api/settings", "GET", undefined, cookie);
/** Telas + Modo foco (carga inicial; depois as mudanças chegam pelo WebSocket). */
export const fetchState = (cookie?: string) =>
  request<FocusResponse>("/api/focus", "GET", undefined, cookie);

// --- telas ---
export const setContent = (clientId: string, update: ContentUpdate) =>
  request<Client>(`/api/clients/${clientId}/content`, "PUT", update);

export const moveClient = (clientId: string, x: number, y: number) =>
  request<Client>(`/api/clients/${clientId}/position`, "PUT", { x, y });

export const lockClient = (clientId: string, locked: boolean) =>
  request<Client>(`/api/clients/${clientId}/lock`, "PUT", { locked });

/** Modo de identificação: cada tela conectada mostra número e nome por alguns segundos. */
export const identifyScreens = () =>
  request<{ seconds: number; numbers: Record<string, number> }>(
    "/api/clients/identify",
    "POST",
  );

// --- Modo foco ---
export const startFocus = (clientId: string) =>
  request<FocusResponse>("/api/focus", "POST", { clientId });

export const endFocus = () => request<FocusResponse>("/api/focus", "DELETE");

// --- catálogo ---
export const createExperience = (input: ExperienceInput) =>
  request<Experience>("/api/experiences", "POST", input);

/** Edita todos os campos; as telas que exibem a experiência passam a mostrar a versão nova. */
export const updateExperience = (experienceId: string, input: ExperienceInput) =>
  request<Experience>(`/api/experiences/${experienceId}`, "PUT", input);

/** Inativar não apaga: só impede novas atribuições. */
export const setExperienceActive = (experienceId: string, active: boolean) =>
  request<Experience>(`/api/experiences/${experienceId}/active`, "PUT", { active });

export const createImage = (input: ImageInput) =>
  request<Image>("/api/images", "POST", input);

export const updateImage = (imageId: string, input: ImageInput) =>
  request<Image>(`/api/images/${imageId}`, "PUT", input);

/** Inativar não apaga: só impede novas atribuições. */
export const setImageActive = (imageId: string, active: boolean) =>
  request<Image>(`/api/images/${imageId}/active`, "PUT", { active });

/** null = sem stand-by (telas sem conteúdo ficam pretas). */
export const setStandbyImage = (standbyImageId: string | null) =>
  request<Settings>("/api/settings", "PUT", { standbyImageId });