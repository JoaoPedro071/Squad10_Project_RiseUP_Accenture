import type { ExperienceInput, FieldErrors } from "@/lib/validation";
import type { Client } from "@/types/client";
import type { Experience } from "@/types/experience";

export class ValidationError extends Error {
  fieldErrors: FieldErrors;

  constructor(fieldErrors: FieldErrors) {
    super("Dados inválidos");
    this.fieldErrors = fieldErrors;
  }
}

async function send<T>(
  url: string,
  method: "POST" | "PUT",
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
  return send<Client>(`/api/clients/${clientId}/display`, "PUT", { displayOff });
}

export function assignExperience(clientId: string, experienceId: string) {
  return send<Client>(`/api/clients/${clientId}/assignment`, "PUT", { experienceId });
}

export function createExperience(input: ExperienceInput) {
  return send<Experience>("/api/experiences", "POST", input);
}