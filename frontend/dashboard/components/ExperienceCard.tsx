"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { orientationLabel } from "@/lib/orientation";
import { sectorLabel } from "@/lib/sectors";
import { ApiError, setExperienceActive } from "@/services/api";
import type { Experience } from "@/types/api";

type ExperienceCardProps = {
  experience: Experience;
  inUseCount: number; // telas com esta experiência atribuída
  canManage: boolean; // Coordenação: pode editar e inativar
};

export default function ExperienceCard({
  experience,
  inUseCount,
  canManage,
}: ExperienceCardProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggleActive() {
    setBusy(true);
    setError("");
    try {
      await setExperienceActive(experience.id, !experience.active);
      router.refresh(); // recarrega a lista do servidor
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={`flex flex-col rounded-lg border border-border bg-surface p-4 ${
        experience.active ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{experience.title}</h2>
        {!experience.active && (
          <span className="rounded-full border border-border px-2 py-1 text-xs">
            Inativa
          </span>
        )}
      </div>
      {experience.description && (
        <p className="mt-2 text-sm text-foreground/80">
          {experience.description}
        </p>
      )}
      <p className="mt-3 text-xs text-foreground/60">
        Página web · {orientationLabel[experience.orientation]}
        {inUseCount > 0 &&
          ` · Em ${inUseCount} ${inUseCount === 1 ? "tela" : "telas"}`}
      </p>
      <ul className="mt-2 flex flex-wrap gap-1" aria-label="Setores e tags">
        {experience.sectors.map((sector) => (
          <li
            key={sector}
            className="rounded-full border border-purple-300/50 px-2 py-0.5 text-xs text-purple-300"
          >
            {sectorLabel(sector)}
          </li>
        ))}
        {experience.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-border px-2 py-0.5 text-xs"
          >
            #{tag}
          </li>
        ))}
      </ul>
      {canManage && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/experiences/${experience.id}/edit`}
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent"
          >
            Editar
          </Link>
          <button
            type="button"
            onClick={toggleActive}
            disabled={busy}
            className="min-h-11 rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Salvando..." : experience.active ? "Inativar" : "Reativar"}
          </button>
        </div>
      )}
      {canManage && experience.active && inUseCount > 0 && (
        <p className="mt-1 text-xs text-foreground/60">
          Ao inativar, as telas continuam exibindo até você trocar o conteúdo.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </article>
  );
}