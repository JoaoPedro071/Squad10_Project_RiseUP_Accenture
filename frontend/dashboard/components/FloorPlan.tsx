"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useBoard } from "@/hooks/useBoard";
import { clientStatus } from "@/lib/status";
import type { Client } from "@/types/client";
import type { Experience } from "@/types/experience";
import type { FocusState } from "@/types/focus";
import FocusBanner from "./FocusBanner";
import FocusModal from "./FocusModal";
import LockModal from "./LockModal";
import ScreenModal from "./ScreenModal";
import StatusBadge from "./StatusBadge";

const POLL_MS = 3000;
const KEY_STEP = 2; // % por seta; com Shift anda 10
const LOCKED_MESSAGE =
  "Esta tela está travada. Use o botão de trava no card para destravar.";

// Tamanhos que acompanham a largura da tela (mínimo, ideal, máximo).
const CARD_WIDTH = "clamp(8.5rem, 13vw, 18rem)";
const nameText = "text-[clamp(0.85rem,1.1vw,1.5rem)] font-bold leading-tight";
const detailText = "text-[clamp(0.7rem,0.9vw,1.2rem)]";
const cardPadding = "p-[clamp(0.5rem,0.8vw,1.1rem)]";

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
  // Evita abrir o modal quando o clique vem de soltar um arrasto.
  const suppressClick = useRef(false);
  // Toque em tela travada: avisa se a pessoa tentar arrastar.
  const pressed = useRef<{ id: string; x: number; y: number } | null>(null);

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

  function positionOf(client: Client) {
    return drag?.id === client.id ? drag : client;
  }

  function handleSelect(client: Client) {
    // No modo edição o clique não abre o modal.
    if (editMode || suppressClick.current) return;
    setSelectedId(client.id);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, client: Client) {
    if (!editMode) return;
    if (client.locked) {
      pressed.current = { id: client.id, x: event.clientX, y: event.clientY };
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id: client.id, x: client.x, y: client.y });
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>, client: Client) {
    const press = pressed.current;
    if (press?.id === client.id) {
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8) {
        pressed.current = null;
        board.notify(LOCKED_MESSAGE);
      }
      return;
    }

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
    pressed.current = null;
    if (drag?.id !== client.id) return;
    const { x, y } = drag;
    setDrag(null);
    // Só salva se realmente mexeu (evita salvar em um simples clique).
    if (Math.abs(x - client.x) > 0.5 || Math.abs(y - client.y) > 0.5) {
      suppressClick.current = true;
      setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      board.move(client.id, round(x), round(y));
    }
  }

  function handlePointerCancel() {
    pressed.current = null;
    setDrag(null);
  }

  // Alternativa por teclado ao arrastar: setas (Shift anda mais).
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, client: Client) {
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
    setSelectedId(null);
    if (clientId) board.startFocusFor(clientId);
  }

  function handleConfirmLock() {
    const target = lockTarget;
    setLockTargetId(null);
    if (target) board.lock(target.id, !target.locked);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {focus && (
        <FocusBanner
          focus={focus}
          clients={clients}
          busy={board.focusBusy}
          onExit={board.exitFocus}
        />
      )}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p
          role="status"
          aria-live="polite"
          className="min-h-6 text-xs text-foreground/60"
        >
          {board.message}
        </p>
        <button
          type="button"
          onClick={() => setEditMode((current) => !current)}
          aria-pressed={editMode}
          className={`min-h-11 rounded-md border px-3 text-xs hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent ${
            editMode
              ? "border-accent text-foreground"
              : "border-transparent text-foreground/60 hover:text-foreground"
          }`}
        >
          <span aria-hidden="true">{editMode ? "✓ " : "✎ "}</span>
          {editMode ? "Concluir edição" : "Editar posições"}
        </button>
      </div>

      {editMode && (
        <p className="mb-2 text-xs text-foreground/60">
          Arraste os monitores ou use as setas do teclado (Shift anda mais). A
          posição é salva ao soltar. Monitores travados não se movem, e o menu
          de opções só abre depois de concluir a edição.
        </p>
      )}

      <div
        ref={planRef}
        role="group"
        aria-label="Planta do escritório"
        className={`relative min-h-72 w-full flex-1 rounded-lg border-2 border-white ${
          editMode ? "bg-accent/5" : ""
        }`}
      >
        {clients.map((client) => {
          const position = positionOf(client);
          const draggable = editMode && !client.locked;
          const dragging = drag?.id === client.id;
          const current = experiences.find(
            (e) => e.id === client.currentExperienceId,
          );

          return (
            <div
              key={client.id}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                width: CARD_WIDTH,
              }}
              className={`absolute flex max-w-[40%] -translate-x-1/2 -translate-y-1/2 flex-col rounded-md border border-border bg-surface ${
                dragging ? "z-10" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelect(client)}
                onPointerDown={(e) => handlePointerDown(e, client)}
                onPointerMove={(e) => handlePointerMove(e, client)}
                onPointerUp={() => handlePointerUp(client)}
                onPointerCancel={handlePointerCancel}
                onKeyDown={(e) => handleKeyDown(e, client)}
                aria-haspopup={editMode ? undefined : "dialog"}
                className={`flex min-h-11 w-full flex-col items-start gap-1 rounded-md ${cardPadding} text-left focus-visible:outline-2 focus-visible:outline-accent ${
                  draggable ? "cursor-grab touch-none select-none" : ""
                }`}
              >
                <StatusBadge status={clientStatus(client)} size="sm" />
                <span className={nameText}>{client.name}</span>
                <span className={`${detailText} text-foreground/70`}>
                  {current ? current.title : "Sem experiência"}
                </span>
                {focus?.clientId === client.id && (
                  <span className={`${detailText} text-yellow-300`}>
                    <span aria-hidden="true">◉ </span>
                    Em foco
                  </span>
                )}
              </button>

              {editMode && (
                <button
                  type="button"
                  onClick={() => setLockTargetId(client.id)}
                  disabled={board.busyId === client.id}
                  className={`min-h-11 w-full rounded-b-md border-t border-border px-[clamp(0.5rem,0.8vw,1.1rem)] text-left ${detailText} hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <span aria-hidden="true">{client.locked ? "🔒 " : "🔓 "}</span>
                  {client.locked ? "Travada" : "Livre"}
                  <span className="sr-only">
                    {" "}
                    — {client.locked ? "destravar" : "travar"} posição de{" "}
                    {client.name}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selected && (
        <ScreenModal
          key={selected.id}
          client={selected}
          experiences={experiences}
          busy={board.busyId === selected.id}
          focusActive={focus !== null || board.focusBusy}
          onClose={() => setSelectedId(null)}
          onAssign={(experienceId) => {
            board.assign(selected.id, experienceId);
            setSelectedId(null);
          }}
          onToggleDisplay={() => board.toggleDisplay(selected)}
          onFocus={() => setFocusTargetId(selected.id)}
        />
      )}

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
    </div>
  );
}