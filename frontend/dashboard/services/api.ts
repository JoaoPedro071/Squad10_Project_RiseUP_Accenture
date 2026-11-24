// Chamadas ao backend FastAPI. Funciona no navegador e nas páginas do servidor.
import { API_URL } from "@/lib/config";
import type { ExperienceInput, ImageInput } from "@/lib/validation";
import type {
  Client,
  ContentUpdate,
  Experience,
  FieldErrors,
  FocusResponse,
  Image,
  Settings,
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

async function request<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    cache: "no-store",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (response.status === 400 && data?.fieldErrors) {
    throw new ValidationError(data.fieldErrors);
  }
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? "Falha na requisição");
  }
  return data as T;
}

// --- leitura ---
export const fetchExperiences = () => request<Experience[]>("/api/experiences");
export const fetchImages = () => request<Image[]>("/api/images");
export const fetchSettings = () => request<Settings>("/api/settings");
/** Telas + Modo foco (usado na carga e na atualização periódica). */
export const fetchState = () => request<FocusResponse>("/api/focus");

// --- telas ---
export const setContent = (clientId: string, update: ContentUpdate) =>
  request<Client>(`/api/clients/${clientId}/content`, "PUT", update);

export const moveClient = (clientId: string, x: number, y: number) =>
  request<Client>(`/api/clients/${clientId}/position`, "PUT", { x, y });

export const lockClient = (clientId: string, locked: boolean) =>
  request<Client>(`/api/clients/${clientId}/lock`, "PUT", { locked });

// --- Modo foco ---
export const startFocus = (clientId: string) =>
  request<FocusResponse>("/api/focus", "POST", { clientId });

export const endFocus = () => request<FocusResponse>("/api/focus", "DELETE");

// --- catálogo ---
export const createExperience = (input: ExperienceInput) =>
  request<Experience>("/api/experiences", "POST", input);

export const createImage = (input: ImageInput) =>
  request<Image>("/api/images", "POST", input);

/** Inativar não apaga: só impede novas atribuições. */
export const setImageActive = (imageId: string, active: boolean) =>
  request<Image>(`/api/images/${imageId}/active`, "PUT", { active });

/** null = sem stand-by (telas sem conteúdo ficam pretas). */
export const setStandbyImage = (standbyImageId: string | null) =>
  request<Settings>("/api/settings", "PUT", { standbyImageId });