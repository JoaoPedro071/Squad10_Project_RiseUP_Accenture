"use client";

import { Monitor, Pencil } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { inputClass, ui } from "@/lib/ui";
import { validateClientName } from "@/lib/validation";
import { ApiError, createClient, renameClient, ValidationError } from "@/services/api";
import type { Client } from "@/types/api";
import FieldError from "./FieldError";
import Notice from "./Notice";
import PlayerAddress from "./PlayerAddress";

type ClientFormModalProps = {
  client?: Client; // presente = renomear; ausente = nova tela
  onClose: () => void;
};

// Cadastro e renomeação de tela. Ao criar, mostra o endereço do player para
// abrir na máquina ligada à tela. A lista nova chega pelo WebSocket.
export default function ClientFormModal({ client, onClose }: ClientFormModalProps) {
  const renaming = client !== undefined;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const [name, setName] = useState(client?.name ?? "");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Client | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    inputRef.current?.focus();
  }, []);

  // Etapa de sucesso: o foco vai para "Concluir" (o campo do endereço vem antes).
  useEffect(() => {
    if (created) doneRef.current?.focus();
  }, [created]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const found = validateClientName(name);
    setError(found);
    if (found) {
      inputRef.current?.focus();
      return;
    }
    setSaving(true);
    try {
      if (renaming) {
        await renameClient(client.id, name.trim());
        onClose();
        return;
      }
      setCreated(await createClient(name.trim()));
    } catch (err) {
      if (err instanceof ValidationError) {
        setError(err.fieldErrors.name ?? Object.values(err.fieldErrors)[0]);
        inputRef.current?.focus();
      } else {
        setFormError(
          err instanceof ApiError ? err.message : "Não foi possível salvar. Tente novamente.",
        );
      }
    } finally {
      setSaving(false);
    }
  }

  const Icon = renaming ? Pencil : Monitor;

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby={titleId} className={ui.dialog}>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent-light">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="text-lg font-bold">
            {renaming ? "Renomear tela" : "Nova tela"}
          </h2>
          {renaming && <p className="truncate text-sm text-muted">{client.name}</p>}
        </div>
      </div>

      {created ? (
        <div className="mt-4 flex flex-col gap-3">
          <Notice variant="success">Tela criada.</Notice>
          <p className="text-sm">
            Abra este endereço na máquina ligada à tela (em tela cheia):
          </p>
          <PlayerAddress clientId={created.id} />
          <div className="mt-3 flex justify-end">
            <button
              ref={doneRef}
              type="button"
              onClick={onClose}
              className={ui.buttonPrimary}
            >
              Concluir
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-3">
          <div>
            <label htmlFor="client-name" className={ui.label}>
              Nome da tela
            </label>
            <input
              ref={inputRef}
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => error && setError(validateClientName(name))}
              placeholder="ex.: Monitor Entrada"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "client-name-error" : undefined}
              className={inputClass(!!error)}
            />
            <FieldError id="client-name-error" message={error} />
          </div>

          {formError && <Notice variant="error">{formError}</Notice>}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={ui.buttonSecondary}
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving} className={ui.buttonPrimary}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
