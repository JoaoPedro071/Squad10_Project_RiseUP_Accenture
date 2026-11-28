"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef } from "react";
import { playerUrl } from "@/lib/config";
import { inputClass, ui } from "@/lib/ui";
import { useCopy } from "@/hooks/useCopy";

type PlayerAddressProps = {
  clientId: string;
  /** Já começa com o texto selecionado (quando a cópia automática falhou). */
  selectOnMount?: boolean;
};

// Endereço do player num campo somente leitura, com o botão "Copiar".
export default function PlayerAddress({ clientId, selectOnMount = false }: PlayerAddressProps) {
  const url = playerUrl(clientId);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state, copy } = useCopy();
  const fieldId = `player-url-${clientId}`;

  useEffect(() => {
    if (selectOnMount) inputRef.current?.select();
  }, [selectOnMount]);

  // Se o navegador bloquear a cópia, deixa o texto selecionado.
  useEffect(() => {
    if (state === "failed") inputRef.current?.select();
  }, [state]);

  return (
    <div>
      <label htmlFor={fieldId} className="sr-only">
        Endereço do player
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          aria-describedby={
            state === "failed" || selectOnMount ? `${fieldId}-hint` : undefined
          }
          className={`${inputClass()} min-w-0 flex-1 font-mono`}
        />
        <button
          type="button"
          onClick={() => copy(url)}
          className={`${ui.buttonSecondary} shrink-0`}
        >
          {state === "copied" ? (
            <Check aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Copy aria-hidden="true" className="h-4 w-4" />
          )}
          {state === "copied" ? "Copiado" : "Copiar"}
        </button>
      </div>
      {(state === "failed" || selectOnMount) && (
        <p id={`${fieldId}-hint`} className={ui.hint}>
          Selecione e copie com Ctrl+C
        </p>
      )}
      <p role="status" className="sr-only">
        {state === "copied" ? "Endereço copiado." : ""}
      </p>
    </div>
  );
}
