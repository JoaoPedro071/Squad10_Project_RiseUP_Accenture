"use client";

import { useState } from "react";
import ExperienceDisplay from "@/components/ExperienceDisplay";
import { experiences } from "@/lib/mock-data";
import type { DisplayState } from "@/types/display";

export default function Home() {
  const [state, setState] = useState<DisplayState>({ kind: "waiting" });
  const [panelOpen, setPanelOpen] = useState(true);

  // O painel só existe em desenvolvimento; some no build de produção.
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