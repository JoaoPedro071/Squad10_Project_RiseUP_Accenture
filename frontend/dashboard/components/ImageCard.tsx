"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { orientationLabel } from "@/lib/orientation";
import { ApiError, setImageActive } from "@/services/api";
import type { Image } from "@/types/api";

type ImageCardProps = {
  image: Image;
  isStandby: boolean; // é a imagem de stand-by atual (não pode ser inativada)
};

export default function ImageCard({ image, isStandby }: ImageCardProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggleActive() {
    setBusy(true);
    setError("");
    try {
      await setImageActive(image.id, !image.active);
      router.refresh(); // recarrega a lista do servidor
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={`flex flex-col rounded-lg border border-border bg-surface p-4 ${
        image.active ? "" : "opacity-60"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt=""
        className="h-36 w-full rounded-md bg-black object-contain"
      />
      <div className="mt-3 flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{image.title}</h2>
        <div className="flex flex-wrap justify-end gap-1">
          {isStandby && (
            <span className="rounded-full border border-purple-300/50 px-2 py-1 text-xs text-purple-300">
              Stand-by atual
            </span>
          )}
          {!image.active && (
            <span className="rounded-full border border-border px-2 py-1 text-xs">
              Inativa
            </span>
          )}
        </div>
      </div>
      {image.description && (
        <p className="mt-2 text-sm text-foreground/80">{image.description}</p>
      )}
      <p className="mt-3 text-xs text-foreground/60">
        {orientationLabel[image.orientation]}
      </p>
      <button
        type="button"
        onClick={toggleActive}
        disabled={busy || (isStandby && image.active)}
        title={isStandby ? "Escolha outro stand-by antes de inativar." : undefined}
        className="mt-4 min-h-11 self-start rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Salvando..." : image.active ? "Inativar" : "Reativar"}
      </button>
      {isStandby && image.active && (
        <p className="mt-1 text-xs text-foreground/60">
          Para inativar, escolha outro stand-by em Configurações.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </article>
  );
}