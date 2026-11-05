"use client";

import { useEffect, useRef, useState } from "react";
import { isIncompatible, orientationLabel } from "@/lib/orientation";
import { clientStatus } from "@/lib/status";
import type { Client } from "@/types/client";
import type { Experience } from "@/types/experience";
import StatusBadge from "./StatusBadge";

const clientAppUrl =
  process.env.NEXT_PUBLIC_CLIENT_APP_URL ?? "http://localhost:3001";

const secondaryButton =
  "min-h-11 rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton =
  "min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

type ScreenModalProps = {
  client: Client;
  experiences: Experience[];
  busy: boolean;
  focusActive: boolean;
  onClose: () => void;
  onAssign: (experienceId: string) => void;
  onToggleDisplay: () => void;
  onFocus: () => void;
};

export default function ScreenModal({
  client,
  experiences,
  busy,
  focusActive,
  onClose,
  onAssign,
  onToggleDisplay,
  onFocus,
}: ScreenModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Experiência incompatível aguardando confirmação.
  const [pending, setPending] = useState<Experience | null>(null);

  // Abre o <dialog> assim que o componente aparece.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const offline = client.status === "offline";
  const disabled = busy || offline;
  const active = experiences.filter((e) => e.active);
  const current = experiences.find((e) => e.id === client.currentExperienceId);

  function choose(experience: Experience) {
    if (isIncompatible(client, experience)) {
      setPending(experience);
      return;
    }
    setPending(null);
    onAssign(experience.id);
  }

  function applyPending() {
    if (!pending) return;
    onAssign(pending.id);
    setPending(null);
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="screen-title"
      className="m-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-surface p-6 text-foreground backdrop:bg-black/60"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 id="screen-title" className="text-lg font-semibold">
          {client.name}
        </h2>
        <StatusBadge status={clientStatus(client)} />
      </div>
      <p className="mt-2 text-sm text-foreground/80">
        {current ? current.title : "Sem experiência configurada"}
      </p>
      <p className="mt-1 text-xs text-foreground/60">
        {orientationLabel[client.orientation]}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onToggleDisplay}
          disabled={disabled}
          className={secondaryButton}
        >
          {busy
            ? "Atualizando..."
            : client.displayOff
              ? "Ligar tela"
              : "Desligar tela"}
        </button>
        <button
          type="button"
          onClick={onFocus}
          disabled={disabled || client.displayOff || focusActive}
          className={secondaryButton}
        >
          Modo foco
        </button>
        <a
          href={`${clientAppUrl}/?client=${client.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-purple-300 underline hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Abrir tela
        </a>
      </div>

      <h3 className="mt-5 text-sm font-semibold">Trocar experiência</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {active.map((experience) => {
          const isCurrent = experience.id === client.currentExperienceId;
          const incompatible = isIncompatible(client, experience);
          return (
            <li key={experience.id}>
              <button
                type="button"
                onClick={() => choose(experience)}
                disabled={disabled}
                aria-current={isCurrent ? "true" : undefined}
                className={`flex min-h-11 w-full flex-col items-start rounded-md border p-3 text-left text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${
                  isCurrent ? "border-accent" : "border-border"
                }`}
              >
                <span className="font-medium">
                  {experience.title}
                  {isCurrent && " (atual)"}
                </span>
                <span className="text-xs text-foreground/70">
                  {orientationLabel[experience.orientation]}
                  {incompatible && (
                    <span className="ml-2 text-yellow-300">
                      <span aria-hidden="true">⚠ </span>
                      Orientação diferente
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {pending && (
        <div
          role="alert"
          className="mt-3 rounded-md border border-yellow-300/50 p-3 text-sm text-yellow-300"
        >
          <p>
            <span aria-hidden="true">⚠ </span>
            {pending.title} é em{" "}
            {orientationLabel[pending.orientation].toLowerCase()} e a tela está
            em {orientationLabel[client.orientation].toLowerCase()}. O conteúdo
            pode aparecer cortado ou com bordas.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={applyPending}
              className={primaryButton}
            >
              Aplicar assim mesmo
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className={secondaryButton}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className={secondaryButton}>
          Fechar
        </button>
      </div>
    </dialog>
  );
}
