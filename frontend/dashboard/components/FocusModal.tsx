"use client";

import { useEffect, useRef } from "react";
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
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const others = clients.filter((c) => c.id !== client.id);
  const connected = others.filter((c) => c.status !== "off");
  const off = others.filter((c) => c.status === "off");

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="focus-title"
      className="m-auto w-full max-w-md rounded-lg border border-border bg-surface p-6 text-foreground backdrop:bg-black/60"
    >
      <h2 id="focus-title" className="text-lg font-semibold">
        Ativar Modo foco
      </h2>
      <p className="mt-1 text-sm text-foreground/70">Apresentar em {client.name}</p>

      <div className="mt-4 text-sm">
        <p className="font-medium">Estas telas ficarão em pausa (tela preta):</p>
        {connected.length > 0 ? (
          <ul className="mt-1 list-disc pl-5">
            {connected.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-foreground/70">Nenhuma outra tela conectada.</p>
        )}

        {off.length > 0 && (
          <div className="mt-3 text-foreground/70">
            <p>Desligadas agora (entram em pausa se reconectarem durante o foco):</p>
            <ul className="mt-1 list-disc pl-5">
              {off.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-3 text-xs text-foreground/60">
          Nenhum conteúdo é alterado: ao sair do foco, cada tela volta ao que
          tinha. A tela fica preta, mas o equipamento não é desligado.
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
          Confirmar Modo foco
        </button>
      </div>
    </dialog>
  );
}