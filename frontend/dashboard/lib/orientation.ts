import type { Client } from "@/types/client";
import type { Experience } from "@/types/experience";

export const orientationLabel = {
  landscape: "Paisagem",
  portrait: "Retrato",
  any: "Qualquer orientação",
} as const;

// Incompatível = a experiência exige uma orientação diferente da tela.
export function isIncompatible(client: Client, experience: Experience): boolean {
  return (
    experience.orientation !== "any" &&
    experience.orientation !== client.orientation
  );
}