import type { Client, FocusState } from "@/types/api";

type FocusBannerProps = {
  focus: FocusState;
  clients: Client[];
  busy: boolean;
  onExit: () => void;
};

export default function FocusBanner({
  focus,
  clients,
  busy,
  onExit,
}: FocusBannerProps) {
  const name = clients.find((c) => c.id === focus.clientId)?.name ?? focus.clientId;

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-yellow-300/60 bg-yellow-300/10 p-4"
    >
      <div>
        <p className="font-semibold text-yellow-300">
          <span aria-hidden="true">◉ </span>
          Modo foco ativo
        </p>
        <p className="mt-1 text-sm text-foreground/80">
          Apresentando em {name}. As demais telas estão em pausa.
        </p>
      </div>
      <button
        type="button"
        onClick={onExit}
        disabled={busy}
        className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Atualizando..." : "Sair do Modo foco"}
      </button>
    </div>
  );
}