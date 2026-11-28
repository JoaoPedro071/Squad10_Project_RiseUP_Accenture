import { Focus } from "lucide-react";
import { ui } from "@/lib/ui";
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
  const name =
    clients.find((c) => c.id === focus.clientId)?.name ?? focus.clientId;

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/60 bg-accent/15 p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent text-white">
          <Focus aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <p className="font-bold text-accent-soft">Modo foco ativo</p>
          <p className="mt-0.5 text-sm text-foreground/80">
            Apresentando em {name}. As demais telas estão em pausa.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onExit}
        disabled={busy}
        className={ui.buttonPrimary}
      >
        {busy ? "Atualizando..." : "Sair do Modo foco"}
      </button>
    </div>
  );
}