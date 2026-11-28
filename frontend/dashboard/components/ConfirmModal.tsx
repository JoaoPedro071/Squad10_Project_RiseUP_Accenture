"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { ui } from "@/lib/ui";
import Notice from "./Notice";

type ConfirmModalProps = {
  title: string;
  children: ReactNode; // explicação do que vai acontecer
  confirmLabel: string;
  busyLabel?: string; // texto do botão enquanto a ação roda
  busy?: boolean;
  error?: string; // mostrado dentro do modal, sem fechar
  onConfirm: () => void;
  onClose: () => void;
};

// Confirmação de ação que remove algo. O foco começa em "Cancelar".
export default function ConfirmModal({
  title,
  children,
  confirmLabel,
  busyLabel = "Aguarde...",
  busy = false,
  error = "",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    cancelRef.current?.focus();
  }, []);

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby={titleId} className={ui.dialog}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-danger/10 text-danger">
          <TriangleAlert aria-hidden="true" className="h-5 w-5" />
        </span>
        <h2 id={titleId} className="min-w-0 text-lg font-bold break-words">
          {title}
        </h2>
      </div>

      <div className="mt-4 text-sm">{children}</div>

      {error && (
        <Notice variant="error" className="mt-4">
          {error}
        </Notice>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button
          ref={cancelRef}
          type="button"
          onClick={onClose}
          disabled={busy}
          className={ui.buttonSecondary}
        >
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} disabled={busy} className={ui.buttonDanger}>
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
