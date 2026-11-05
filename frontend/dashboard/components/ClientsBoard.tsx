"use client";

import { useState } from "react";
import type { Client } from "@/types/client";
import type { Experience } from "@/types/experience";
import type { FocusState } from "@/types/focus";
import {
  assignExperience,
  endFocus,
  setDisplayOff,
  startFocus,
} from "@/services/api";
import ClientCard from "./ClientCard";
import ExperienceModal from "./ExperienceModal";
import FocusBanner from "./FocusBanner";
import FocusModal from "./FocusModal";

type ClientsBoardProps = {
  initialClients: Client[];
  experiences: Experience[];
  initialFocus: FocusState | null;
};

export default function ClientsBoard({
  initialClients,
  experiences,
  initialFocus,
}: ClientsBoardProps) {
  const [clients, setClients] = useState(initialClients);
  const [focus, setFocus] = useState(initialFocus);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [focusBusy, setFocusBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const editingClient = clients.find((c) => c.id === editingId);
  const focusTarget = clients.find((c) => c.id === focusTargetId);

  function replaceClient(updated: Client) {
    setClients((current) =>
      current.map((c) => (c.id === updated.id ? updated : c)),
    );
  }

  async function handleToggleDisplay(client: Client) {
    setBusyId(client.id);
    setMessage("Atualizando...");
    try {
      const updated = await setDisplayOff(client.id, !client.displayOff);
      replaceClient(updated);
      setMessage("Concluído. A tela atualiza em instantes.");
    } catch {
      setMessage("Não foi possível concluir a ação. Tente novamente.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmExperience(experienceId: string) {
    const clientId = editingId;
    if (!clientId) return;

    setEditingId(null);
    setBusyId(clientId);
    setMessage("Atualizando...");
    try {
      const updated = await assignExperience(clientId, experienceId);
      replaceClient(updated);
      setMessage("Concluído. A tela atualiza em instantes.");
    } catch {
      setMessage("Não foi possível trocar a experiência. Tente novamente.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleStartFocus() {
    const clientId = focusTargetId;
    if (!clientId) return;

    setFocusTargetId(null);
    setFocusBusy(true);
    setMessage("Atualizando...");
    try {
      const result = await startFocus(clientId);
      setClients(result.clients);
      setFocus(result.focus);
      const offline = result.focus?.offlineIds.length ?? 0;
      setMessage(
        offline > 0
          ? `Modo foco ativo, parcial: ${offline} tela(s) offline não foram apagadas.`
          : "Concluído. Modo foco ativo.",
      );
    } catch {
      setMessage("Não foi possível ativar o modo foco. Tente novamente.");
    } finally {
      setFocusBusy(false);
    }
  }

  async function handleEndFocus() {
    setFocusBusy(true);
    setMessage("Atualizando...");
    try {
      const result = await endFocus();
      setClients(result.clients);
      setFocus(result.focus);
      setMessage("Concluído. As telas foram restauradas.");
    } catch {
      setMessage("Não foi possível sair do modo foco. Tente novamente.");
    } finally {
      setFocusBusy(false);
    }
  }

  return (
    <>
      {focus && (
        <FocusBanner
          focus={focus}
          clients={clients}
          busy={focusBusy}
          onExit={handleEndFocus}
        />
      )}

      <p
        role="status"
        aria-live="polite"
        className="mb-4 min-h-6 text-sm text-foreground/80"
      >
        {message}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            experiences={experiences}
            busy={busyId === client.id}
            onToggleDisplay={() => handleToggleDisplay(client)}
            onChangeExperience={() => setEditingId(client.id)}
            focusActive={focus !== null || focusBusy}
            onFocus={() => setFocusTargetId(client.id)}
          />
        ))}
      </div>

      {editingClient && (
        <ExperienceModal
          key={editingClient.id}
          client={editingClient}
          experiences={experiences}
          onClose={() => setEditingId(null)}
          onConfirm={handleConfirmExperience}
        />
      )}

      {focusTarget && (
        <FocusModal
          key={focusTarget.id}
          client={focusTarget}
          clients={clients}
          onClose={() => setFocusTargetId(null)}
          onConfirm={handleStartFocus}
        />
      )}
    </>
  );
}