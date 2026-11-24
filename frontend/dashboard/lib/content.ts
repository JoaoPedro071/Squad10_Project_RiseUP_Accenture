import type { Client, Experience, Image } from "@/types/api";

export type Catalog = { experiences: Experience[]; images: Image[] };

// O que a tela exibe quando está ligada (mesma prioridade do backend).
export function contentLabel(client: Client, catalog: Catalog): string {
  const image = catalog.images.find((i) => i.id === client.imgId);
  if (client.displayImg && image) return `Imagem: ${image.title}`;
  const experience = catalog.experiences.find(
    (e) => e.id === client.currentExperienceId,
  );
  if (experience) return experience.title;
  return "Stand-by (sem conteúdo)";
}

// Quando o conteúdo escolhido ainda não aparece na tela física.
export function pendingNote(client: Client): string | null {
  if (client.status === "off") {
    return "Tela desligada: o conteúdo aparece quando ela voltar a se conectar.";
  }
  if (client.status === "paused") {
    return "Em pausa pelo Modo foco: o conteúdo aparece ao sair do foco.";
  }
  return null;
}