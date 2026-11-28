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

// Último contato da tela: "agora" enquanto conectada; desligada mostra quando
// foi visto pela última vez.
export function lastSeenText(client: Client, now = Date.now()): string {
  if (client.status !== "off") return "Agora (conectada)";
  if (!client.lastSeenAt) return "Nunca se conectou";
  const minutes = Math.floor((now - new Date(client.lastSeenAt).getTime()) / 60000);
  if (minutes < 1) return "Há menos de 1 min";
  if (minutes < 60) return `Há ${minutes} min`;
  return new Date(client.lastSeenAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}