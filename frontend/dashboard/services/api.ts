import type { ExperienceInput, FieldErrors } from "@/lib/validation";
import type { Client } from "@/types/client";
import type { Experience } from "@/types/experience";
import type { FocusState } from "@/types/focus";

export class ValidationError extends Error {
  fieldErrors: FieldErrors;

  constructor(fieldErrors: FieldErrors) {
    super("Dados inválidos");
    this.fieldErrors = fieldErrors;
  }
}

async function send<T>(
  url: string,
  method: "POST" | "PUT" | "DELETE",
  body: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (response.status === 400) {
    const data = await response.json();
    throw new ValidationError(data.fieldErrors ?? {});
  }
  if (!response.ok) {
    throw new Error("Falha na requisição");
  }
  return response.json() as Promise<T>;
}

export function setDisplayOff(clientId: string, displayOff: boolean) {
  return send<Client>(`/api/clients/${clientId}/display`, "PUT", {
    displayOff,
  });
}

export function assignExperience(clientId: string, experienceId: string) {
  return send<Client>(`/api/clients/${clientId}/assignment`, "PUT", {
    experienceId,
  });
}

export function createExperience(input: ExperienceInput) {
  return send<Experience>("/api/experiences", "POST", input);
}

export type FocusResponse = { focus: FocusState | null; clients: Client[] };

export function startFocus(clientId: string) {
  return send<FocusResponse>("/api/focus", "POST", { clientId });
}

export function endFocus() {
  return send<FocusResponse>("/api/focus", "DELETE", undefined);
}

export function moveClient(clientId: string, x: number, y: number) {
  return send<Client>(`/api/clients/${clientId}/position`, "PUT", { x, y });
}

// Estado completo (telas + modo foco), usado na atualização periódica da planta.
export async function fetchState(): Promise<FocusResponse> {
  const response = await fetch("/api/focus", { cache: "no-store" });
  if (!response.ok) throw new Error("Falha na requisição");
  return response.json() as Promise<FocusResponse>;
}

export function lockClient(clientId: string, locked: boolean) {
  return send<Client>(`/api/clients/${clientId}/lock`, "PUT", { locked });
}