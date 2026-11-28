"use client";

import { Eye, EyeOff, Pencil, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { mediaUrl } from "@/lib/config";
import { orientationLabel } from "@/lib/orientation";
import { ui } from "@/lib/ui";
import { ApiError, setImageActive } from "@/services/api";
import type { Image } from "@/types/api";
import Notice from "./Notice";

type ImageCardProps = {
  image: Image;
  isStandby: boolean; // é a imagem de stand-by atual (não pode ser inativada)
  canManage: boolean; // Coordenação: pode editar e inativar
};

export default function ImageCard({
  image,
  isStandby,
  canManage,
}: ImageCardProps) {
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
        err instanceof ApiError
          ? err.message
          : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  }

  const showHint = canManage && isStandby && image.active;

  // Mesmo formato do ExperienceCard: corpo em cima, rodapé com os botões embaixo.
  return (
    <article
      className={`${ui.cardFrame} ${image.active ? "" : "opacity-60"}`}
    >
      <div className="flex flex-1 flex-col p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl(image.url)}
          alt=""
          className="h-36 w-full rounded-md border border-border bg-black object-contain"
        />
        <div className="mt-3 flex items-start justify-between gap-2">
          <h2 className="text-lg leading-tight font-bold">{image.title}</h2>
          <div className="flex flex-wrap justify-end gap-1">
            {isStandby && (
              <span className={`${ui.chipAccent} gap-1`}>
                <Star aria-hidden="true" className="h-3 w-3" />
                Stand-by atual
              </span>
            )}
            {!image.active && <span className={ui.chip}>Inativa</span>}
          </div>
        </div>
        {image.description && (
          <p className="mt-2 text-sm text-foreground/80">{image.description}</p>
        )}
        <p className="mt-3 text-xs text-muted">
          {orientationLabel[image.orientation]}
        </p>
        {showHint && (
          <div className="mt-3">
            <p className={ui.hint}>
              Para inativar, escolha outro stand-by em Configurações.
            </p>
          </div>
        )}
        {error && (
          <Notice variant="error" className="mt-3">
            {error}
          </Notice>
        )}
      </div>
      {canManage && (
        <div className={ui.cardFooter}>
          <Link
            href={`/images/${image.id}/edit`}
            className={ui.buttonSecondary}
          >
            <Pencil aria-hidden="true" className="h-4 w-4" />
            Editar
          </Link>
          <button
            type="button"
            onClick={toggleActive}
            disabled={busy || (isStandby && image.active)}
            title={
              isStandby
                ? "Escolha outro stand-by antes de inativar."
                : undefined
            }
            className={ui.buttonSecondary}
          >
            {image.active ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
            {busy ? "Salvando..." : image.active ? "Inativar" : "Reativar"}
          </button>
        </div>
      )}
    </article>
  );
}