"use client";

import { useState } from "react";
import { useBoard } from "@/hooks/useBoard";
import type { Client, Experience, FocusState, Image } from "@/types/api";
import ClientCard from "./ClientCard";
import FocusBanner from "./FocusBanner";
import FocusModal from "./FocusModal";
import ScreenModal from "./ScreenModal";

const POLL_MS = 3000;

type ClientsBoardProps = {
  initialClients: Client[];
  initialFocus: FocusState | null;
  experiences: Experience[];
  images: Image[];
};

export default function ClientsBoard({
  initialClients,
  initialFocus,
  experiences,
  images,
}: ClientsBoardProps) {
  const board = useBoard(initialClients, initialFocus, POLL_MS);
  const { clients, focus } = board;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);

  const editing = clients.find((c) => c.id === editingId);
  const focusTarget = clients.find((c) => c.id === focusTargetId);
  const focusActive = focus !== null || board.focusBusy;

  return (
    <>
      {focus && (
        <FocusBanner
          focus={focus}
          clients={clients}
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
        {clients.map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            catalog={{ experiences, images }}
            busy={board.busyId === client.id}
            focusActive={focusActive}
            onConfigure={() => setEditingId(client.id)}
            onFocus={() => setFocusTargetId(client.id)}
          />
        ))}
      </div>

      {editing && (
        <ScreenModal
          key={`screen-${editing.id}`}
          client={editing}
          experiences={experiences}
          images={images}
          busy={board.busyId === editing.id}
          focusActive={focusActive}
          onClose={() => setEditingId(null)}
          onUpdate={(update) => {
            board.updateContent(editing.id, update);
            setEditingId(null);
          }}
          onFocus={() => {
            setEditingId(null);
            setFocusTargetId(editing.id);
          }}
        />
      )}

      {focusTarget && (
        <FocusModal
          key={`focus-${focusTarget.id}`}
          client={focusTarget}
          clients={clients}
          onClose={() => setFocusTargetId(null)}
          onConfirm={() => {
            setFocusTargetId(null);
            board.startFocusFor(focusTarget.id);
          }}
        />
      )}
    </>
  );
}