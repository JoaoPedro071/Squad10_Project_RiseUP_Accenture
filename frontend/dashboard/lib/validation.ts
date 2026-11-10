import type { Experience } from "@/types/experience";

export type ExperienceInput = {
  title: string;
  description: string;
  url: string;
  type: Experience["type"];
  orientation: Experience["orientation"];
};

export type FieldErrors = Partial<Record<keyof ExperienceInput, string>>;

const types = ["web", "image"];
const orientations = ["landscape", "portrait", "any"];

function isValidUrl(value: string): boolean {
  // Caminhos internos como /demo são aceitos para a demonstração.
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateExperience(input: Partial<ExperienceInput>): FieldErrors {
  const errors: FieldErrors = {};
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "");
  const url = String(input.url ?? "").trim();

  if (!title) errors.title = "Informe o título da experiência.";
  else if (title.length > 80) errors.title = "Use no máximo 80 caracteres no título.";

  if (description.length > 300) {
    errors.description = "Use no máximo 300 caracteres na descrição.";
  }

  if (!url) errors.url = "Informe o endereço do conteúdo.";
  else if (!isValidUrl(url)) {
    errors.url = "Use um endereço começando com http:// ou https://.";
  }

  if (!input.type || !types.includes(input.type)) {
    errors.type = "Escolha o tipo de conteúdo.";
  }
  if (!input.orientation || !orientations.includes(input.orientation)) {
    errors.orientation = "Escolha a orientação.";
  }
  return errors;
}