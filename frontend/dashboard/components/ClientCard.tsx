import { ExternalLink, Focus, Monitor, RotateCw, TriangleAlert } from "lucide-react";
import { CLIENT_APP_URL } from "@/lib/config";
import { contentLabel, pendingNote } from "@/lib/content";
import type { Catalog } from "@/lib/content";
import { screenOrientationText } from "@/lib/orientation";
import { ui } from "@/lib/ui";
import type { Client } from "@/types/api";
import StatusBadge from "./StatusBadge";

type ClientCardProps = {
  client: Client;
  catalog: Catalog;
  busy: boolean;
  focusActive: boolean;
  number?: number; // modo de identificação
  onOpen: () => void; // abre os detalhes (ScreenModal)
  onFocus: () => void;
};

// Card da lista de telas: a área de cima inteira é UM botão que abre os
// detalhes; o rodapé tem as ações rápidas (fora do botão, sem aninhar).
// Dentro do botão só entram elementos de texto (span), como pede o HTML.
export default function ClientCard({
  client,
  catalog,
  busy,
  focusActive,
  number,
  onOpen,
  onFocus,
}: ClientCardProps) {
  const note = pendingNote(client);
  const detailsId = `client-${client.id}-details`;

  return (
    <article className="interactive flex h-full flex-col rounded-lg border border-border bg-card hover:border-accent-light/60">
      <button
        type="button"
        onClick={onOpen}
        disabled={busy}
        aria-haspopup="dialog"
        aria-label={`Abrir detalhes de ${client.name}`}
        aria-describedby={detailsId}
        className="interactive flex flex-1 flex-col items-stretch rounded-t-lg p-4 text-left enabled:hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent-light">
              <Monitor aria-hidden="true" className="h-5 w-5" />
              {number !== undefined && (
                <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                  <span className="sr-only">Número </span>
                  {number}
                </span>
              )}
            </span>
            <span className="text-lg leading-tight font-bold break-words">
              {client.name}
            </span>
          </span>
          <StatusBadge status={client.status} />
        </span>

        <span id={detailsId} className="flex flex-col">
          <span className="mt-3 block text-sm">{contentLabel(client, catalog)}</span>
          <span className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <RotateCw aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            {screenOrientationText(client)}
          </span>
          {client.orientationMismatch && (
            <span className="mt-1 flex items-center gap-1.5 text-xs text-status-error">
              <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              A orientação da tela não combina com o conteúdo
            </span>
          )}
          {note && (
            // Mesmo visual do Notice "warning" (que é um bloco e não pode ficar no botão).
            <span className="mt-3 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
              <TriangleAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {note}
            </span>
          )}
          {busy && (
            <span className="mt-3 block text-xs font-bold text-accent-soft">
              Atualizando...
            </span>
          )}
        </span>
      </button>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border px-2 py-1">
        <button
          type="button"
          onClick={onFocus}
          disabled={busy || client.status === "off" || focusActive}
          className={ui.buttonGhostCompact}
        >
          <Focus aria-hidden="true" className="h-4 w-4" />
          Modo foco
          <span className="sr-only"> em {client.name}</span>
        </button>
        <a
          href={`${CLIENT_APP_URL}/?client=${client.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={ui.buttonGhostCompact}
        >
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
          Abrir tela
          <span className="sr-only"> {client.name} (abre em nova aba)</span>
        </a>
      </div>
    </article>
  );
}
