import type { Client } from "@/types/client";
import type { Experience } from "@/types/experience";
import StatusBadge from "./StatusBadge";

const clientAppUrl =
  process.env.NEXT_PUBLIC_CLIENT_APP_URL ?? "http://localhost:3001";

type ClientCardProps = {
  client: Client;
  experiences: Experience[];
  busy: boolean;
  onToggleDisplay: () => void;
  onChangeExperience: () => void;
};

export default function ClientCard({
  client,
  experiences,
  busy,
  onToggleDisplay,
  onChangeExperience,
}: ClientCardProps) {
  const status =
    client.status === "offline"
      ? "offline"
      : client.displayOff
        ? "standby"
        : "online";

  const current = experiences.find((e) => e.id === client.currentExperienceId);
  const unavailable = busy || client.status === "offline";

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{client.name}</h2>
        <StatusBadge status={status} />
      </div>
      <p className="mt-2 text-sm text-foreground/80">
        {current ? current.title : "Sem experiência configurada"}
      </p>
      <p className="mt-3 text-xs text-foreground/60">
        {client.orientation === "landscape" ? "Paisagem" : "Retrato"}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onChangeExperience}
          disabled={unavailable}
          className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Trocar experiência
        </button>
        <button
          type="button"
          onClick={onToggleDisplay}
          disabled={unavailable}
          className="min-h-11 rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy
            ? "Atualizando..."
            : client.displayOff
              ? "Ligar tela"
              : "Desligar tela"}
        </button>
        <a
          href={`${clientAppUrl}/?client=${client.id}`}
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
