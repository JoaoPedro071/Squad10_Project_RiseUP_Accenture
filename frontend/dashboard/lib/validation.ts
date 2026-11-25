import type { Experience } from "@/types/api";

export type ExperienceInput = {
  title: string;
  description: string;
  url: string;
  type: Experience["type"];
  orientation: Experience["orientation"];
  sectors: Experience["sectors"];
  tags: string[];
};

export type FieldErrors = Partial<Record<keyof ExperienceInput, string>>;

const types = ["web"]; // imagens têm catálogo próprio
const orientations = ["landscape", "portrait", "any"];
const sectors = ["finance", "retail", "emerging_tech", "other"];
export const MAX_TAGS = 5;
export const MAX_TAG_LENGTH = 30;

/** Tags sem espaços nas pontas, sem vazias e sem repetidas (ignora maiúsculas). */
export function cleanTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim();
    const key = tag.toLocaleLowerCase("pt-BR");
    if (tag && !seen.has(key)) {
      seen.add(key);
      result.push(tag);
    }
  }
  return result;
}

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

export function validateExperience(
  input: Partial<ExperienceInput>,
): FieldErrors {
  const errors: FieldErrors = {};
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "");
  const url = String(input.url ?? "").trim();

  if (!title) errors.title = "Informe o título da experiência.";
  else if (title.length > 80)
    errors.title = "Use no máximo 80 caracteres no título.";

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

  const chosen = input.sectors ?? [];
  if (chosen.length === 0) errors.sectors = "Escolha ao menos um setor.";
  else if (chosen.some((sector) => !sectors.includes(sector))) {
    errors.sectors = "Escolha setores da lista.";
  }

  const tags = cleanTags(input.tags ?? []);
  if (tags.length > MAX_TAGS) errors.tags = `Use no máximo ${MAX_TAGS} tags.`;
  else if (tags.some((tag) => tag.length > MAX_TAG_LENGTH)) {
    errors.tags = `Use no máximo ${MAX_TAG_LENGTH} caracteres por tag.`;
  }
  return errors;
}

// --- imagens

// --- imagens (mesmas regras e mensagens do backend) ---
export type ImageInput = {
  title: string;
  description: string;
  url: string;
  orientation: Experience["orientation"];
};

export type ImageFieldErrors = Partial<Record<keyof ImageInput, string>>;

export function validateImage(input: Partial<ImageInput>): ImageFieldErrors {
  const errors: ImageFieldErrors = {};
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "");
  const url = String(input.url ?? "").trim();

  if (!title) errors.title = "Informe o título da imagem.";
  else if (title.length > 80)
    errors.title = "Use no máximo 80 caracteres no título.";

  if (description.length > 300) {
    errors.description = "Use no máximo 300 caracteres na descrição.";
  }

  if (!url) errors.url = "Informe o endereço da imagem.";
  else if (!isValidUrl(url)) {
    errors.url = "Use um endereço começando com http:// ou https://.";
  }

  if (!input.orientation || !orientations.includes(input.orientation)) {
    errors.orientation = "Escolha a orientação.";
  }
  return errors;
}
