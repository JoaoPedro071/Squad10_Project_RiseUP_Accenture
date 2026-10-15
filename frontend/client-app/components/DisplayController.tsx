"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ExperienceDisplay from "@/components/ExperienceDisplay";
import { experiences } from "@/lib/mock-data";
import type { DisplayState } from "@/types/display";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const POLL_INTERVAL_MS = 1500;

export default function DisplayController() {
  const clientId = useSearchParams().get("client");
  const [state, setState] = useState<DisplayState>({ kind: "waiting" });
  const [panelOpen, setPanelOpen] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    const id = clientId;
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch(
          `${API_URL}/api/clients/${encodeURIComponent(id)}/display`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const next: DisplayState = await response.json();
        if (cancelled) return;
        // Só troca o estado se mudou, para não recarregar a tela à toa.
        setState((previous) =>
          JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
        );
      } catch {
        // Sem conexão: mantém o último estado e tenta de novo no próximo ciclo.
      }
    }

    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [clientId]);

  // Modo conectado: segue o dashboard, sem painel e sem cursor.
  if (clientId) {
    return (
      <div className="cursor-none">
        <ExperienceDisplay state={state} />
      </div>
    );
  }

  // Modo manual (sem ?client=): painel de desenvolvimento.
  const isDev = process.env.NODE_ENV === "development";
  const buttonStyle =
    "min-h-11 rounded-md border border-white/30 px-3 text-left hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <>
      <ExperienceDisplay state={state} />

      {isDev && (
        <div className="fixed bottom-4 right-4 z-10 flex max-w-xs flex-col gap-2 rounded-lg border border-white/20 bg-black/80 p-3 text-sm">
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            className={buttonStyle}
          >
            {panelOpen ? "Ocultar painel dev" : "Painel dev"}
          </button>

          {panelOpen && (
            <>
              <button
                type="button"
                className={buttonStyle}
                onClick={() => setState({ kind: "waiting" })}
              >
                Aguardando
              </button>
              {experiences.map((experience) => (
                <button
                  key={experience.id}
                  type="button"
                  className={buttonStyle}
                  onClick={() => setState({ kind: "showing", experience })}
                >
                  Exibir: {experience.title}
                </button>
              ))}
              <button
                type="button"
                className={buttonStyle}
                onClick={() => setState({ kind: "off" })}
              >
                Tela desligada
              </button>
              <button
                type="button"
                className={buttonStyle}
                onClick={() => setState({ kind: "error" })}
              >
                Simular falha
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}