"use client";

import { useState } from "react";
import type { DisplayState } from "@/types/display";

type ExperienceDisplayProps = {
  state: DisplayState;
};

export default function ExperienceDisplay({
  state,
}: ExperienceDisplayProps) {
  const [failedId, setFailedId] = useState<string | null>(null);

  // Tela desligada: preto total.
  if (state.kind === "off") {
    return (
      <div
        role="img"
        aria-label="Tela desligada"
        className="h-screen w-screen bg-black"
      />
    );
  }

  // Aguardando uma experiência.
  if (state.kind === "waiting") {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-6">
        <span
          aria-hidden="true"
          className="h-4 w-4 rounded-full bg-accent motion-safe:animate-pulse"
        />

        <p className="text-2xl text-foreground/70">
          Aguardando experiência...
        </p>
      </main>
    );
  }

  // Falha de carregamento ou erro solicitado pelo controlador.
  const imageFailed =
    state.kind === "showing" &&
    failedId === state.experience.id;

  if (state.kind === "error" || imageFailed) {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-2xl text-foreground/70">
          Não foi possível carregar o conteúdo.
        </p>

        <p className="text-sm text-foreground/50">
          Verifique a conexão da tela ou selecione outra
          experiência no painel.
        </p>
      </main>
    );
  }

  // Exibição de imagem ou página web.
  const { experience } = state;

  if (experience.type === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={experience.url}
        alt={experience.title}
        onError={() => setFailedId(experience.id)}
        className="h-screen w-screen object-contain"
      />
    );
  }

  return (
    <iframe
      src={experience.url}
      title={experience.title}
      className="h-screen w-screen border-0"
    />
  );
}