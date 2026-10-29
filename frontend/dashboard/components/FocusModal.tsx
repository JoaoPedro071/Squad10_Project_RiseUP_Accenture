"use client";

import { useEffect, useRef } from "react";
import { planFocus } from "@/lib/focus";
import type { Client } from "@/types/client";

type FocusModalProps = {
  client: Client;
  clients: Client[];
  onClose: () => void;
  onConfirm: () => void;
};

export default function FocusModal({
  client,
  clients,
  onClose,
  onConfirm,
}: FocusModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const plan = planFocus(clients, client.id);
  if (!plan) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="focus-title"
      className="m-auto w-full max-w-md rounded-lg border border-border bg-surface p-6 text-foreground backdrop:bg-black/60"
    >
      <h2 id="focus-title" className="text-lg font-semibold">
        Ativar modo foco
      </h2>
      <p className="mt-1 text-sm text-foreground/70">
        Apresentar em {client.name} · {client.room}
      </p>

      <div className="mt-4 text-sm">
        <p className="font-medium">As telas abaixo ficarão pretas:</p>
        {plan.toDarken.length > 0 ? (
          <ul className="mt-1 list-disc pl-5">
            {plan.toDarken.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-foreground/70">
            Nenhuma outra tela ligada nesta sala.
          </p>
        )}

        {plan.offline.length > 0 && (
          <div className="mt-3 text-yellow-300">
            <p>
              <span aria-hidden="true">⚠ </span>
              Offline, não serão apagadas (resultado parcial):
            </p>
            <ul className="mt-1 list-disc pl-5">
              {plan.offline.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-3 text-xs text-foreground/60">
          A tela fica preta, mas o equipamento não é desligado.
        </p>
      </div>

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
          onClick={onConfirm}
          className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Confirmar modo foco
        </button>
      </div>
    </dialog>
  );
}