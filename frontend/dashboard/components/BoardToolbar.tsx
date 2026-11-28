// Barra da planta e da lista: legenda, mensagem da última ação, aviso de
// conexão em tempo real e o botão "Identificar telas".
import { Hash } from "lucide-react";
import type { ReactNode } from "react";
import { ui } from "@/lib/ui";
import Notice from "./Notice";
import StatusLegend from "./StatusLegend";

type BoardToolbarProps = {
  message: string;
  live: boolean;
  onIdentify: () => void;
  children?: ReactNode; // botões extras (ex.: "Editar posições" na planta)
};

export default function BoardToolbar({
  message,
  live,
  onIdentify,
  children,
}: BoardToolbarProps) {
  return (
    <div className="mb-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusLegend />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onIdentify} className={ui.buttonGhost}>
            <Hash aria-hidden="true" className="h-4 w-4" />
            Identificar telas
          </button>
          {children}
        </div>
      </div>
      {!live && (
        <Notice variant="warning">
          Sem conexão em tempo real. Tentando reconectar...
        </Notice>
      )}
      {/* Sempre no HTML (o leitor de tela anuncia quando a mensagem aparece),
          mas sem ocupar espaço vazia: sr-only a tira do fluxo, então o gap
          do flex também não conta. */}
      <p role="status" aria-live="polite" className="text-sm text-accent-soft empty:sr-only">
        {message}
      </p>
    </div>
  );
}