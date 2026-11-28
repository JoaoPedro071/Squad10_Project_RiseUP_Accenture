"use client";

import { Focus } from "lucide-react";
import { useEffect, useRef } from "react";
import { ui } from "@/lib/ui";
import type { Client } from "@/types/api";

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
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const others = clients.filter((c) => c.id !== client.id);
  const connected = others.filter((c) => c.status !== "off");
  const off = others.filter((c) => c.status === "off");

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="focus-title"
      className={ui.dialog}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent-light">
          <Focus aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 id="focus-title" className="text-lg font-bold">
            Ativar Modo foco
          </h2>
          <p className="text-sm text-muted">Apresentar em {client.name}</p>
        </div>
      </div>

      <div className="mt-4 text-sm">
        <p className="font-bold">Estas telas ficarão em pausa (tela preta):</p>
        {connected.length > 0 ? (
          <ul className="mt-1 list-disc pl-5">
            {connected.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-muted">Nenhuma outra tela conectada.</p>
        )}

        {off.length > 0 && (
          <div className="mt-3 text-muted">
            <p>
              Desligadas agora (entram em pausa se reconectarem durante o foco):
            </p>
            <ul className="mt-1 list-disc pl-5">
              {off.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
          </div>
        )}

        <p className={`${ui.hint} mt-3`}>
          Nenhum conteúdo é alterado: ao sair do foco, cada tela volta ao que
          tinha. A tela fica preta, mas o equipamento não é desligado.
        </p>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={ui.buttonSecondary}>
          Cancelar
        </button>
        <button type="button" onClick={onConfirm} className={ui.buttonPrimary}>
          Confirmar Modo foco
        </button>
      </div>
    </dialog>
  );
}