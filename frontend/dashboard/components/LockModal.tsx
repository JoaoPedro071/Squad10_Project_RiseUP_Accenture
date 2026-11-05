"use client";

import { useEffect, useRef } from "react";
import type { Client } from "@/types/client";

type LockModalProps = {
  client: Client;
  onClose: () => void;
  onConfirm: () => void;
};

export default function LockModal({
  client,
  onClose,
  onConfirm,
}: LockModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // Se está travada, a ação é destravar (e vice-versa).
  const locking = !client.locked;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="lock-title"
      className="m-auto w-full max-w-md rounded-lg border border-border bg-surface p-6 text-foreground backdrop:bg-black/60"
    >
      <h2 id="lock-title" className="text-lg font-semibold">
        {locking ? "Travar posição" : "Destravar posição"}
      </h2>
      <p className="mt-1 text-sm text-foreground/70">{client.name}</p>

      <p className="mt-4 text-sm">
        <span aria-hidden="true">{locking ? "🔒 " : "🔓 "}</span>
        {locking
          ? "Com a posição travada, esta tela não poderá ser movida na planta (nem arrastando, nem pelo teclado) até ser destravada."
          : "Ao destravar, qualquer pessoa que use o modo de edição poderá mover esta tela na planta."}
      </p>

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
          {locking ? "Travar posição" : "Destravar posição"}
        </button>
      </div>
    </dialog>
  );
}