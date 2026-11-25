// Linha de avisos da planta e da lista: mensagem da última ação, aviso de
// conexão em tempo real e o botão "Identificar telas".
import type { ReactNode } from "react";

type BoardToolbarProps = {
  message: string;
  live: boolean;
  onIdentify: () => void;
  children?: ReactNode; // botões extras (ex.: "Editar posições" na planta)
};

export default function BoardToolbar({ message, live, onIdentify, children }: BoardToolbarProps) {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
      <div className="min-h-6 text-xs text-foreground/60">
        <p role="status" aria-live="polite">
          {message}
        </p>
        {!live && (
          <p className="text-yellow-300">
            <span aria-hidden="true">⚠ </span>
            Sem conexão em tempo real. Tentando reconectar...
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onIdentify}
          className="min-h-11 rounded-md border border-transparent px-3 text-xs text-foreground/60 hover:bg-accent/20 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true"># </span>
          Identificar telas
        </button>
        {children}
      </div>
    </div>
  );
}