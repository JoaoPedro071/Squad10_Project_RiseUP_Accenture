"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useBoard } from "@/hooks/useBoard";
import { statusConfig, statusOrder } from "@/lib/status";
import { inputClass, ui } from "@/lib/ui";
import type { Client, Experience, FocusState, Image, ScreenStatus } from "@/types/api";
import BoardToolbar from "./BoardToolbar";
import ClientCard from "./ClientCard";
import FocusBanner from "./FocusBanner";
import FocusModal from "./FocusModal";
import MetricCard from "./MetricCard";
import ScreenModal from "./ScreenModal";

// Para a busca: sem acentos e sem diferenciar maiúsculas ("recepcao" acha "Recepção").
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("pt-BR");
}

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
  const board = useBoard(initialClients, initialFocus);
  const { clients, focus } = board;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);

  const editing = clients.find((c) => c.id === editingId);
  const focusTarget = clients.find((c) => c.id === focusTargetId);
  const focusActive = focus !== null || board.focusBusy;

  // Busca e filtro: só no navegador, sobre o estado em tempo real.
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScreenStatus | "all">("all");
  const wanted = normalize(query.trim());
  const shown = clients.filter(
    (c) =>
      (statusFilter === "all" || c.status === statusFilter) &&
      normalize(c.name).includes(wanted),
  );

  // Métricas: mudam sozinhas a cada aviso do WebSocket.
  const count = (test: (c: Client) => boolean) => clients.filter(test).length;

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

      <section
        aria-label="Resumo das telas"
        className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <MetricCard label="Telas cadastradas" value={clients.length} />
        <MetricCard label="Conectadas" value={count((c) => c.status !== "off")} />
        <MetricCard label="Em uso" value={count((c) => c.status === "busy")} />
        <MetricCard
          label="Com erro"
          value={count((c) => c.status === "error")}
          alert
        />
      </section>

      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <label htmlFor="screen-search" className="sr-only">
            Buscar tela pelo nome
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            id="screen-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tela..."
            className={`${inputClass()} pl-9`}
          />
        </div>
        <div className="md:w-60">
          <label htmlFor="screen-status" className="sr-only">
            Filtrar por estado
          </label>
          <select
            id="screen-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ScreenStatus | "all")}
            className={inputClass()}
          >
            <option value="all">Todos os estados</option>
            {statusOrder.map((status) => (
              <option key={status} value={status}>
                {statusConfig[status].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <BoardToolbar
        message={board.message}
        live={board.live}
        onIdentify={board.identify}
      />

      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
          Nenhuma tela encontrada.
        </p>
      ) : (
        <div className={ui.cardGrid}>
          {shown.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              catalog={{ experiences, images }}
              busy={board.busyId === client.id}
              focusActive={focusActive}
              number={board.numbers?.[client.id]}
              onOpen={() => setEditingId(client.id)}
              onFocus={() => setFocusTargetId(client.id)}
            />
          ))}
        </div>
      )}

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