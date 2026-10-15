"use client";

import { useState } from "react";
import type { Client } from "@/types/client";
import type { Experience } from "@/types/experience";
import { assignExperience, setDisplayOff } from "@/services/api";
import ClientCard from "./ClientCard";
import ExperienceModal from "./ExperienceModal";

type ClientsBoardProps = {
  initialClients: Client[];
  experiences: Experience[];
};

export default function ClientsBoard({
  initialClients,
  experiences,
}: ClientsBoardProps) {
  const [clients, setClients] = useState(initialClients);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const editingClient = clients.find((c) => c.id === editingId);

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

  return (
    <>
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
    </>
  );
}