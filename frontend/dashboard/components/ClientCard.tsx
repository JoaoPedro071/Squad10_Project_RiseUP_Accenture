import { ExternalLink, Focus, Monitor, RotateCw, TriangleAlert } from "lucide-react";
import { CLIENT_APP_URL } from "@/lib/config";
import { contentLabel, pendingNote } from "@/lib/content";
import type { Catalog } from "@/lib/content";
import { screenOrientationText } from "@/lib/orientation";
import { ui } from "@/lib/ui";
import type { Client } from "@/types/api";
import Notice from "./Notice";
import StatusBadge from "./StatusBadge";

type ClientCardProps = {
  client: Client;
  catalog: Catalog;
  busy: boolean;
  focusActive: boolean;
  number?: number; // modo de identificação
  onConfigure: () => void;
  onFocus: () => void;
};

export default function ClientCard({
  client,
  catalog,
  busy,
  focusActive,
  number,
  onConfigure,
  onFocus,
}: ClientCardProps) {
  const note = pendingNote(client);

  return (
    <article className={`${ui.card} flex flex-col`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent-light">
            <Monitor aria-hidden="true" className="h-5 w-5" />
            {number !== undefined && (
              <span className="absolute -top-2 -right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                <span className="sr-only">Número </span>
                {number}
              </span>
            )}
          </span>
          <h2 className="text-lg leading-tight font-bold">{client.name}</h2>
        </div>
        <StatusBadge status={client.status} />
      </div>

      <p className="mt-3 text-sm">{contentLabel(client, catalog)}</p>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
        <RotateCw aria-hidden="true" className="h-3.5 w-3.5" />
        {screenOrientationText(client)}
      </p>
      {client.orientationMismatch && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-status-error">
          <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5" />
          A orientação da tela não combina com o conteúdo
        </p>
      )}
      {note && (
        <Notice variant="warning" className="mt-3 text-xs">
          {note}
        </Notice>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <button
          type="button"
          onClick={onConfigure}
          disabled={busy}
          className={ui.buttonPrimary}
        >
          {busy ? "Atualizando..." : "Trocar conteúdo"}
        </button>
        <button
          type="button"
          onClick={onFocus}
          disabled={busy || client.status === "off" || focusActive}
          className={ui.buttonSecondary}
        >
          <Focus aria-hidden="true" className="h-4 w-4" />
          Modo foco
        </button>
        <a
          href={`${CLIENT_APP_URL}/?client=${client.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={ui.buttonGhost}
        >
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
          Abrir tela
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
      </div>
    </article>
  );
}