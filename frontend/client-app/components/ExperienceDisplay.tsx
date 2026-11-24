"use client";

import { useState } from "react";
import StatusScreen from "@/components/StatusScreen";
import type { DisplayState } from "@/types/api";

type ExperienceDisplayProps = {
  state: DisplayState;
};

function BlackScreen({ label }: { label: string }) {
  return <div role="img" aria-label={label} className="h-screen w-screen bg-black" />;
}

export default function ExperienceDisplay({ state }: ExperienceDisplayProps) {
  // Endereço da última imagem que falhou ao carregar (estado local do player).
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  // Modo foco ativo e esta não é a tela em foco.
  if (state.kind === "paused") {
    return <BlackScreen label="Tela em pausa" />;
  }

  if (state.kind === "experience") {
    const { experience } = state;
    return (
      <iframe
        src={experience.url}
        title={experience.title}
        className="h-screen w-screen border-0"
      />
    );
  }

  // "image" (atribuída) ou "standby" (imagem global, ou nenhuma = preto).
  const { image } = state;
  const isStandby = state.kind === "standby";

  if (!image) {
    return <BlackScreen label="Stand-by" />;
  }

  if (failedUrl === image.url) {
    // No stand-by, uma falha fica discreta (preto); na imagem atribuída, avisa.
    return isStandby ? (
      <BlackScreen label="Stand-by" />
    ) : (
      <StatusScreen
        title="Não foi possível carregar o conteúdo."
        detail="Verifique o endereço da imagem ou escolha outro conteúdo no painel."
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.url}
      alt={image.title}
      onError={() => setFailedUrl(image.url)}
      className="h-screen w-screen bg-black object-contain"
    />
  );
}