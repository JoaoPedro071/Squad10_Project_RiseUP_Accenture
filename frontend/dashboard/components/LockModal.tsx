"use client";

import { Lock, LockOpen } from "lucide-react";
import { useEffect, useRef } from "react";
import { ui } from "@/lib/ui";
import type { Client } from "@/types/api";

type LockModalProps = {
  client: Client;
  onClose: () => void;
  onConfirm: () => void;
};

export default function LockModal({ client, onClose, onConfirm }: LockModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  // Se está travada, a ação é destravar (e vice-versa).
  const locking = !client.locked;
  const Icon = locking ? Lock : LockOpen;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="lock-title"
      className={ui.dialog}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent-light">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 id="lock-title" className="text-lg font-bold">
            {locking ? "Travar posição" : "Destravar posição"}
          </h2>
          <p className="text-sm text-muted">{client.name}</p>
        </div>
      </div>

      <p className="mt-4 text-sm">
        {locking
          ? "Com a posição travada, esta tela não poderá ser movida na planta (nem arrastando, nem pelo teclado) até ser destravada."
          : "Ao destravar, qualquer pessoa que use o modo de edição poderá mover esta tela na planta."}
      </p>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={ui.buttonSecondary}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} className={ui.buttonPrimary}>
          {locking ? "Travar posição" : "Destravar posição"}
        </button>
      </div>
    </dialog>
  );
}