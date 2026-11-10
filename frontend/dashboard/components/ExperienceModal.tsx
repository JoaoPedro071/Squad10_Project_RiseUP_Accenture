"use client";

import { useEffect, useRef, useState } from "react";
import { isIncompatible, orientationLabel } from "@/lib/orientation";
import type { Client } from "@/types/client";
import type { Experience } from "@/types/experience";

type ExperienceModalProps = {
  client: Client;
  experiences: Experience[];
  onClose: () => void;
  onConfirm: (experienceId: string) => void;
};

export default function ExperienceModal({
  client,
  experiences,
  onClose,
  onConfirm,
}: ExperienceModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Começa já marcando a experiência atual da tela (ou nada).
  const [selectedId, setSelectedId] = useState<string | null>(
    client.currentExperienceId,
  );

  // Abre o <dialog> assim que o componente aparece.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const activeExperiences = experiences.filter((e) => e.active);
  const selected = activeExperiences.find((e) => e.id === selectedId);
  const mismatch = selected ? isIncompatible(client, selected) : false;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="modal-title"
      className="m-auto w-full max-w-md rounded-lg border border-border bg-surface p-6 text-foreground backdrop:bg-black/60"
    >
      <h2 id="modal-title" className="text-lg font-semibold">
        Trocar experiência
      </h2>
      <p className="mt-1 text-sm text-foreground/70">
        {client.name} · {client.room} · {orientationLabel[client.orientation]}
      </p>

      <fieldset className="mt-4 flex flex-col gap-2">
        <legend className="sr-only">Experiências disponíveis</legend>
        {activeExperiences.map((experience) => {
          const incompatible = isIncompatible(client, experience);
          return (
            <label
              key={experience.id}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-accent/20 has-checked:border-accent"
            >
              <input
                type="radio"
                name="experience"
                value={experience.id}
                checked={selectedId === experience.id}
                onChange={() => setSelectedId(experience.id)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">{experience.title}</span>
                <span className="block text-xs text-foreground/70">
                  {experience.description}
                </span>
                <span className="mt-1 block text-xs text-foreground/60">
                  {orientationLabel[experience.orientation]}
                  {incompatible && (
                    <span className="ml-2 text-yellow-300">
                      <span aria-hidden="true">⚠ </span>
                      Orientação diferente da tela
                    </span>
                  )}
                </span>
              </span>
            </label>
          );
        })}
      </fieldset>

      {mismatch && selected && (
        <p
          role="status"
          className="mt-4 rounded-md border border-yellow-300/50 p-3 text-sm text-yellow-300"
        >
          <span aria-hidden="true">⚠ </span>
          Esta experiência é em{" "}
          {orientationLabel[selected.orientation].toLowerCase()} e a tela está
          em {orientationLabel[client.orientation].toLowerCase()}. O conteúdo
          pode aparecer cortado ou com bordas. Aplique assim mesmo ou escolha
          outro conteúdo.
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => selectedId && onConfirm(selectedId)}
          disabled={!selectedId}
          className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mismatch ? "Aplicar assim mesmo" : "Confirmar"}
        </button>
      </div>
    </dialog>
  );
}
