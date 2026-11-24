import type { Client, ContentOrientation } from "@/types/api";

export const orientationLabel = {
  landscape: "Paisagem",
  portrait: "Retrato",
  any: "Qualquer orientação",
} as const;

// Incompatível = o conteúdo exige uma orientação diferente da que a tela informou.
export function isIncompatible(
  client: Client,
  item: { orientation: ContentOrientation },
): boolean {
  return (
    item.orientation !== "any" &&
    client.reportedOrientation !== null &&
    item.orientation !== client.reportedOrientation
  );
}

// Orientação e resolução informadas pela própria tela.
export function screenOrientationText(client: Client): string {
  if (!client.reportedOrientation) return "Orientação ainda não informada pela tela";
  const label = orientationLabel[client.reportedOrientation];
  return client.reportedResolution ? `${label} · ${client.reportedResolution}` : label;
}