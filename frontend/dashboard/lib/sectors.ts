import type { ExperienceSector } from "@/types/api";

/** Setores na ordem de exibição (a mesma do backend). */
export const sectorOptions: { value: ExperienceSector; label: string }[] = [
  { value: "finance", label: "Financeiro" },
  { value: "retail", label: "Varejo" },
  { value: "emerging_tech", label: "Tecnologias Emergentes" },
  { value: "other", label: "Outro" },
];

export function sectorLabel(sector: ExperienceSector): string {
  return sectorOptions.find((option) => option.value === sector)?.label ?? sector;
}