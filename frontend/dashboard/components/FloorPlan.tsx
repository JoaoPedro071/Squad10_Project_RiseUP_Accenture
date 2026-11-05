"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useBoard } from "@/hooks/useBoard";
import { orientationLabel } from "@/lib/orientation";
import { clientStatus } from "@/lib/status";
import type { Client } from "@/types/client";
import type { Experience } from "@/types/experience";
import type { FocusState } from "@/types/focus";
import FocusBanner from "./FocusBanner";
import FocusModal from "./FocusModal";
import LockModal from "./LockModal";
import ScreenPanel from "./ScreenPanel";
import StatusBadge from "./StatusBadge";

const POLL_MS = 3000;
const KEY_STEP = 2; // % por seta; com Shift anda 10
const LOCKED_MESSAGE =
  "Esta tela está travada. Destrave no painel para movê-la.";

// Mantém o marcador inteiro dentro do container.
const clamp = (value: number) => Math.min(95, Math.max(5, value));
const round = (value: number) => Math.round(value * 10) / 10;

const arrows: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

type FloorPlanProps = {
  initialClients: Client[];
  initialFocus: FocusState | null;
  experiences: Experience[];
};

export default function FloorPlan({
  initialClients,
  initialFocus,
  experiences,
}: FloorPlanProps) {
  const board = useBoard(initialClients, initialFocus, POLL_MS);
  const { clients, focus } = board;

  const planRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);
  const [lockTargetId, setLockTargetId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(
    null,
  );

  const selected = clients.find((c) => c.id === selectedId);
  const focusTarget = clients.find((c) => c.id === focusTargetId);
  const lockTarget = clients.find((c) => c.id === lockTargetId);
  const online = clients.filter((c) => c.status === "online").length;
  const activeCount = experiences.filter((e) => e.active).length;

  function positionOf(client: Client) {
    return drag?.id === client.id ? drag : client;
  }

  function handlePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    client: Client,
  ) {
    if (!editMode) return;
    if (client.locked) {
      board.notify(LOCKED_MESSAGE);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id: client.id, x: client.x, y: client.y });
  }

  function handlePointerMove(
    event: PointerEvent<HTMLButtonElement>,
    client: Client,
  ) {
    if (drag?.id !== client.id) return;
    const rect = planRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDrag({
      id: client.id,
      x: clamp(((event.clientX - rect.left) / rect.width) * 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100),
    });
  }

  function handlePointerUp(client: Client) {
    if (drag?.id !== client.id) return;
    const { x, y } = drag;
    setDrag(null);
    // Só salva se realmente mexeu (evita salvar em um simples clique).
    if (Math.abs(x - client.x) > 0.5 || Math.abs(y - client.y) > 0.5) {
      board.move(client.id, round(x), round(y));
    }
  }

  // Alternativa por teclado ao arrastar: setas (Shift anda mais).
  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    client: Client,
  ) {
    if (!editMode) return;
    const direction = arrows[event.key];
    if (!direction) return;
    event.preventDefault();
    if (client.locked) {
      board.notify(LOCKED_MESSAGE);
      return;
    }
    const step = event.shiftKey ? 10 : KEY_STEP;
    board.move(
      client.id,
      round(clamp(client.x + direction[0] * step)),
      round(clamp(client.y + direction[1] * step)),
    );
  }

  function handleConfirmFocus() {
    const clientId = focusTargetId;
    setFocusTargetId(null);
    if (clientId) board.startFocusFor(clientId);
  }

  function handleConfirmLock() {
    const target = lockTarget;
    setLockTargetId(null);
    if (target) board.lock(target.id, !target.locked);
  }

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

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-foreground/80">
          Telas online: {online} de {clients.length} · Experiências ativas:{" "}
          {activeCount}
        </p>
        <button
          type="button"
          onClick={() => setEditMode((current) => !current)}
          aria-pressed={editMode}
          className="min-h-11 rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent"
        >
          {editMode ? "Concluir edição" : "Editar posições"}
        </button>
      </div>

      {editMode && (
        <p className="mb-3 text-sm text-foreground/70">
          Arraste uma tela ou selecione e use as setas do teclado (Shift anda
          mais). A posição é salva ao soltar. Telas travadas não se movem:
          destrave no painel.
        </p>
      )}

      <p
        role="status"
        aria-live="polite"
        className="mb-3 min-h-6 text-sm text-foreground/80"
      >
        {board.message}
      </p>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div>
          <div
            ref={planRef}
            role="group"
            aria-label="Planta do escritório"
            className={`relative aspect-video w-full rounded-lg border-2 border-white ${
              editMode ? "bg-accent/5" : ""
            }`}
          >
            {clients.map((client) => {
              const position = positionOf(client);
              const draggable = editMode && !client.locked;
              const isSelected = selectedId === client.id;
              const current = experiences.find(
                (e) => e.id === client.currentExperienceId,
              );

              return (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedId(client.id)}
                  onPointerDown={(e) => handlePointerDown(e, client)}
                  onPointerMove={(e) => handlePointerMove(e, client)}
                  onPointerUp={() => handlePointerUp(client)}
                  onPointerCancel={() => setDrag(null)}
                  onKeyDown={(e) => handleKeyDown(e, client)}
                  aria-pressed={isSelected}
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                  className={`absolute flex min-h-11 min-w-11 w-36 max-w-[40%] -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-1 rounded-md border bg-surface p-2 text-left text-xs focus-visible:outline-2 focus-visible:outline-accent ${
                    isSelected
                      ? "border-accent ring-2 ring-accent"
                      : "border-border"
                  } ${draggable ? "cursor-grab touch-none" : ""}`}
                >
                  <span className="text-sm font-medium">{client.name}</span>
                  <StatusBadge status={clientStatus(client)} />
                  <span className="text-foreground/70">
                    {current ? current.title : "Sem experiência"}
                  </span>
                  {focus?.clientId === client.id && (
                    <span className="text-yellow-300">
                      <span aria-hidden="true">◉ </span>
                      Em foco
                    </span>
                  )}
                  {editMode && (
                    <span className="text-foreground/70">
                      <span aria-hidden="true">
                        {client.locked ? "🔒 " : "🔓 "}
                      </span>
                      {client.locked ? "Travada" : "Livre"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <h2 className="mt-6 text-lg font-semibold">Lista de telas</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {clients.map((client) => {
              const current = experiences.find(
                (e) => e.id === client.currentExperienceId,
              );
              return (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(client.id)}
                    aria-pressed={selectedId === client.id}
                    className={`flex min-h-11 w-full flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-left text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent ${
                      selectedId === client.id
                        ? "border-accent"
                        : "border-border"
                    }`}
                  >
                    <span>
                      <span className="block font-medium">{client.name}</span>
                      <span className="block text-xs text-foreground/70">
                        {current
                          ? current.title
                          : "Sem experiência configurada"}{" "}
                        · {orientationLabel[client.orientation]}
                        {editMode && (
                          <>
                            {" · "}
                            <span aria-hidden="true">
                              {client.locked ? "🔒 " : "🔓 "}
                            </span>
                            {client.locked ? "Travada" : "Livre"}
                          </>
                        )}
                      </span>
                    </span>
                    <StatusBadge status={clientStatus(client)} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside aria-label="Detalhes da tela">
          {selected ? (
            <ScreenPanel
              key={selected.id}
              client={selected}
              experiences={experiences}
              busy={board.busyId === selected.id}
              focusActive={focus !== null || board.focusBusy}
              onClose={() => setSelectedId(null)}
              onAssign={(experienceId) =>
                board.assign(selected.id, experienceId)
              }
              onToggleDisplay={() => board.toggleDisplay(selected)}
              onFocus={() => setFocusTargetId(selected.id)}
              onToggleLock={() => setLockTargetId(selected.id)}
              editMode={editMode}
            />
          ) : (
            <p className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground/70">
              Selecione uma tela na planta ou na lista para ver as ações.
            </p>
          )}
        </aside>
      </div>

      {focusTarget && (
        <FocusModal
          key={focusTarget.id}
          client={focusTarget}
          clients={clients}
          onClose={() => setFocusTargetId(null)}
          onConfirm={handleConfirmFocus}
        />
      )}

      {lockTarget && (
        <LockModal
          key={lockTarget.id}
          client={lockTarget}
          onClose={() => setLockTargetId(null)}
          onConfirm={handleConfirmLock}
        />
      )}
    </>
  );
}
