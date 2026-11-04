"use client";

import { useState } from "react";
import { useBoard } from "@/hooks/useBoard";
import type { Client } from "@/types/client";
import type { Experience } from "@/types/experience";
import type { FocusState } from "@/types/focus";
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
  const board = useBoard(initialClients, initialFocus);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);

  const editingClient = board.clients.find((c) => c.id === editingId);
  const focusTarget = board.clients.find((c) => c.id === focusTargetId);

  function handleConfirmExperience(experienceId: string) {
    const clientId = editingId;
    setEditingId(null);
    if (clientId) board.assign(clientId, experienceId);
  }

  function handleConfirmFocus() {
    const clientId = focusTargetId;
    setFocusTargetId(null);
    if (clientId) board.startFocusFor(clientId);
  }

  return (
    <>
      {board.focus && (
        <FocusBanner
          focus={board.focus}
          clients={board.clients}
          busy={board.focusBusy}
          onExit={board.exitFocus}
        />
      )}

      <p
        role="status"
        aria-live="polite"
        className="mb-4 min-h-6 text-sm text-foreground/80"
      >
        {board.message}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {board.clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            experiences={experiences}
            busy={board.busyId === client.id}
            onToggleDisplay={() => board.toggleDisplay(client)}
            onChangeExperience={() => setEditingId(client.id)}
            focusActive={board.focus !== null || board.focusBusy}
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
          clients={board.clients}
          onClose={() => setFocusTargetId(null)}
          onConfirm={handleConfirmFocus}
        />
      )}
    </>
  );
}