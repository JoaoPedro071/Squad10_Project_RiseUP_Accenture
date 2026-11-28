"use client";

import { useEffect, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "failed";

const COPIED_MS = 2000;

/** Copia um texto. "copied" volta a "idle" depois de 2 s. Se o navegador
 * bloquear (ex.: página sem HTTPS), fica "failed" e quem usa mostra o texto
 * selecionado para a pessoa copiar com Ctrl+C. */
export function useCopy() {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy(text: string) {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      timer.current = setTimeout(() => setState("idle"), COPIED_MS);
    } catch {
      setState("failed");
    }
  }

  return { state, copy };
}
