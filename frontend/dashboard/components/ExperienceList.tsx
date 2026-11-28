"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { matches } from "@/lib/search";
import { inputClass, ui } from "@/lib/ui";
import type { Experience } from "@/types/api";
import ExperienceCard from "./ExperienceCard";

type ExperienceListProps = {
  tabs: ReactNode; // abas Ativas/Inativas (links da página do servidor)
  experiences: Experience[]; // só as da aba escolhida
  inUseCounts: Record<string, number>; // telas com cada experiência atribuída
  canManage: boolean;
  emptyMessage: string; // aba sem nenhuma experiência
};

// Grade de experiências com busca por título e descrição (no navegador,
// sem acentos e sem diferenciar maiúsculas), dentro da aba escolhida.
export default function ExperienceList({
  tabs,
  experiences,
  inUseCounts,
  canManage,
  emptyMessage,
}: ExperienceListProps) {
  const [query, setQuery] = useState("");
  const shown = experiences.filter((e) => matches(query, e.title, e.description));

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {tabs}
        <div className="relative md:w-80">
          <label htmlFor="experience-search" className="sr-only">
            Buscar experiência pelo título ou descrição
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            id="experience-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar experiência..."
            className={`${inputClass()} pl-9`}
          />
        </div>
      </div>

      {experiences.length === 0 ? (
        <p className="text-muted">{emptyMessage}</p>
      ) : shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          Nenhuma experiência encontrada.
        </p>
      ) : (
        <div className={ui.cardGrid}>
          {shown.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              inUseCount={inUseCounts[experience.id] ?? 0}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </>
  );
}
