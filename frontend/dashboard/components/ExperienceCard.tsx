"use client";

import { Eye, EyeOff, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { orientationLabel } from "@/lib/orientation";
import { ui } from "@/lib/ui";
import { ApiError, setExperienceActive } from "@/services/api";
import type { Experience } from "@/types/api";
import Notice from "./Notice";

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
      className={`${ui.card} flex flex-col ${
        experience.active ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg leading-tight font-bold">{experience.title}</h2>
        {!experience.active && <span className={ui.chip}>Inativa</span>}
      </div>
      {experience.description && (
        <p className="mt-2 text-sm text-foreground/80">
          {experience.description}
        </p>
      )}
      <p className="mt-3 text-xs text-muted">
        Página web · {orientationLabel[experience.orientation]}
        {inUseCount > 0 &&
          ` · Em ${inUseCount} ${inUseCount === 1 ? "tela" : "telas"}`}
      </p>
      {canManage && (
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Link
            href={`/experiences/${experience.id}/edit`}
            className={ui.buttonSecondary}
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
            Editar
          </Link>
          <button
            type="button"
            onClick={toggleActive}
            disabled={busy}
            className={ui.buttonSecondary}
          >
            {experience.active ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
            {busy ? "Salvando..." : experience.active ? "Inativar" : "Reativar"}
          </button>
        </div>
      )}
      {canManage && experience.active && inUseCount > 0 && (
        <p className={ui.hint}>
          Ao inativar, as telas continuam exibindo até você trocar o conteúdo.
        </p>
      )}
      {error && (
        <Notice variant="error" className="mt-2">
          {error}
        </Notice>
      )}
    </article>
  );
}