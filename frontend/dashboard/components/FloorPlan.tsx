"use client";

import {
  Check,
  Focus,
  Lock,
  LockOpen,
  Move,
  TriangleAlert,
} from "lucide-react";
import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { useBoard } from "@/hooks/useBoard";
import { contentLabel } from "@/lib/content";
import { ui } from "@/lib/ui";
import type { Client, Experience, FocusState, Image } from "@/types/api";
import BoardToolbar from "./BoardToolbar";
import FocusBanner from "./FocusBanner";
import FocusModal from "./FocusModal";
import LockModal from "./LockModal";
import ScreenModal from "./ScreenModal";
import StatusBadge from "./StatusBadge";

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
  images: Image[];
  canEditPositions: boolean; // Coordenação: mover e travar telas
};

export default function FloorPlan({
  initialClients,
  initialFocus,
  experiences,
  images,
  canEditPositions,
}: FloorPlanProps) {
  const board = useBoard(initialClients, initialFocus);
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

  function handlePointerDown(
    event: PointerEvent<HTMLButtonElement>,
    client: Client,
  ) {
    if (!editMode) return;
    if (client.locked) {
      pressed.current = { id: client.id, x: event.clientX, y: event.clientY };
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id: client.id, x: client.x, y: client.y });
  }

  function handlePointerMove(
    event: PointerEvent<HTMLButtonElement>,
    client: Client,
  ) {
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

      <BoardToolbar
        message={board.message}
        live={board.live}
        onIdentify={board.identify}
      >
        {canEditPositions && (
          <button
            type="button"
            onClick={() => setEditMode((current) => !current)}
            aria-pressed={editMode}
            className={editMode ? ui.buttonPrimary : ui.buttonGhost}
          >
            {editMode ? (
              <Check aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Move aria-hidden="true" className="h-4 w-4" />
            )}
            {editMode ? "Concluir edição" : "Editar posições"}
          </button>
        )}
      </BoardToolbar>

      {editMode && (
        <p className="mb-2 text-xs text-muted">
          Arraste os monitores ou use as setas do teclado (Shift anda mais). A
          posição é salva ao soltar. Monitores travados não se movem, e o menu
          de opções só abre depois de concluir a edição.
        </p>
      )}

      <div
        ref={planRef}
        role="group"
        aria-label="Planta do escritório"
        className={`relative min-h-72 w-full flex-1 rounded-lg border ${
          editMode
            ? "border-dashed border-accent-light/60 bg-accent/5"
            : "border-border bg-surface"
        }`}
      >
        {clients.map((client) => {
          const position = positionOf(client);
          const draggable = editMode && !client.locked;
          const dragging = drag?.id === client.id;
          const number = board.numbers?.[client.id];

          return (
            <div
              key={client.id}
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                width: CARD_WIDTH,
              }}
              className={`absolute flex max-w-[40%] -translate-x-1/2 -translate-y-1/2 flex-col rounded-md border bg-card ${
                focus?.clientId === client.id
                  ? "border-accent"
                  : "border-border"
              } ${dragging ? "z-10 shadow-lg shadow-accent/20" : ""}`}
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
                className={`interactive flex min-h-11 w-full flex-col items-start gap-1 rounded-md ${cardPadding} text-left hover:bg-accent/10 ${
                  draggable ? "cursor-grab touch-none select-none" : ""
                }`}
              >
                <span className="flex w-full items-start justify-between gap-1">
                  <StatusBadge status={client.status} size="sm" />
                  {number !== undefined && (
                    <span className="rounded-md bg-accent px-2 text-lg leading-7 font-bold text-white">
                      <span className="sr-only">Número </span>
                      {number}
                    </span>
                  )}
                </span>
                <span className={nameText}>{client.name}</span>
                <span className={`${detailText} text-muted`}>
                  {contentLabel(client, { experiences, images })}
                </span>
                {client.orientationMismatch && (
                  <span
                    className={`${detailText} flex items-center gap-1 text-status-error`}
                  >
                    <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5" />
                    Orientação incorreta
                  </span>
                )}
                {focus?.clientId === client.id && (
                  <span
                    className={`${detailText} flex items-center gap-1 text-accent-light`}
                  >
                    <Focus aria-hidden="true" className="h-3.5 w-3.5" />
                    Em foco
                  </span>
                )}
              </button>

              {editMode && (
                <button
                  type="button"
                  onClick={() => setLockTargetId(client.id)}
                  disabled={board.busyId === client.id}
                  className={`interactive flex min-h-11 w-full items-center gap-1.5 rounded-b-md border-t border-border px-[clamp(0.5rem,0.8vw,1.1rem)] text-left ${detailText} hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {client.locked ? (
                    <Lock
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-accent-light"
                    />
                  ) : (
                    <LockOpen
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-muted"
                    />
                  )}
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
          key={`screen-${selected.id}`}
          client={selected}
          experiences={experiences}
          images={images}
          busy={board.busyId === selected.id}
          focusActive={focus !== null || board.focusBusy}
          onClose={() => setSelectedId(null)}
          onUpdate={(update) => {
            board.updateContent(selected.id, update);
            setSelectedId(null);
          }}
          onFocus={() => setFocusTargetId(selected.id)}
        />
      )}

      {focusTarget && (
        <FocusModal
          key={`focus-${focusTarget.id}`}
          client={focusTarget}
          clients={clients}
          onClose={() => setFocusTargetId(null)}
          onConfirm={handleConfirmFocus}
        />
      )}

      {lockTarget && (
        <LockModal
          key={`lock-${lockTarget.id}`}
          client={lockTarget}
          onClose={() => setLockTargetId(null)}
          onConfirm={handleConfirmLock}
        />
      )}
    </div>
  );
}