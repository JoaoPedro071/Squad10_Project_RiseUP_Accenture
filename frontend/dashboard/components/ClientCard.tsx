import { CLIENT_APP_URL } from "@/lib/config";
import { contentLabel, pendingNote } from "@/lib/content";
import type { Catalog } from "@/lib/content";
import { screenOrientationText } from "@/lib/orientation";
import type { Client } from "@/types/api";
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
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {number !== undefined && (
            <span className="mr-2 rounded-md bg-accent px-2 text-white">
              <span className="sr-only">Número </span>
              {number}
            </span>
          )}
          {client.name}
        </h2>
        <StatusBadge status={client.status} />
      </div>
      <p className="mt-2 text-sm text-foreground/80">
        {contentLabel(client, catalog)}
      </p>
      <p className="mt-3 text-xs text-foreground/60">
        {screenOrientationText(client)}
      </p>
      {client.orientationMismatch && (
        <p className="mt-1 text-xs text-orange-400">
          <span aria-hidden="true">⚠ </span>A orientação da tela não combina com
          o conteúdo
        </p>
      )}
      {note && <p className="mt-1 text-xs text-yellow-300">{note}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfigure}
          disabled={busy}
          className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Atualizando..." : "Trocar conteúdo"}
        </button>
        <button
          type="button"
          onClick={onFocus}
          disabled={busy || client.status === "off" || focusActive}
          className="min-h-11 rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Modo foco
        </button>
        <a
          href={`${CLIENT_APP_URL}/?client=${client.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-purple-300 underline hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Abrir tela
        </a>
      </div>
    </article>
  );
}
