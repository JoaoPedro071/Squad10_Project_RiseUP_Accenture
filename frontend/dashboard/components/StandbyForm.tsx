"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { orientationLabel } from "@/lib/orientation";
import { ApiError, setStandbyImage } from "@/services/api";
import type { Image } from "@/types/api";

type StandbyFormProps = {
  images: Image[]; // só as ativas
  initialStandbyId: string | null;
};

const NONE = "none"; // opção "sem imagem" (tela preta)

export default function StandbyForm({ images, initialStandbyId }: StandbyFormProps) {
  const router = useRouter();
  const [savedId, setSavedId] = useState(initialStandbyId ?? NONE);
  const [selectedId, setSelectedId] = useState(initialStandbyId ?? NONE);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("Salvando...");
    try {
      const settings = await setStandbyImage(selectedId === NONE ? null : selectedId);
      setSavedId(settings.standbyImageId ?? NONE);
      setMessage("Concluído. As telas sem conteúdo atualizam em instantes.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof ApiError ? error.message : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  const optionClass =
    "flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-accent/20 has-checked:border-accent";

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <fieldset>
        <legend className="text-lg font-semibold">Imagem de stand-by</legend>
        <p className="mt-1 text-sm text-foreground/70">
          Exibida pelas telas ligadas que estão sem conteúdo.
        </p>

        <div className="mt-3 flex flex-col gap-2">
          <label className={optionClass}>
            <input
              type="radio"
              name="standby"
              value={NONE}
              checked={selectedId === NONE}
              onChange={() => setSelectedId(NONE)}
            />
            <span>
              <span className="block font-medium">Nenhuma</span>
              <span className="block text-xs text-foreground/60">Tela preta</span>
            </span>
          </label>

          {images.map((image) => (
            <label key={image.id} className={optionClass}>
              <input
                type="radio"
                name="standby"
                value={image.id}
                checked={selectedId === image.id}
                onChange={() => setSelectedId(image.id)}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt=""
                className="h-12 w-20 shrink-0 rounded bg-black object-contain"
              />
              <span>
                <span className="block font-medium">
                  {image.title}
                  {image.id === savedId && " (atual)"}
                </span>
                <span className="block text-xs text-foreground/60">
                  {orientationLabel[image.orientation]}
                </span>
              </span>
            </label>
          ))}
        </div>

        {images.length === 0 && (
          <p className="mt-3 text-sm text-foreground/70">
            Nenhuma imagem ativa.{" "}
            <Link href="/images/new" className="text-purple-300 underline">
              Cadastre uma imagem
            </Link>{" "}
            para usar como stand-by.
          </p>
        )}
        <p className="mt-3 text-xs text-foreground/60">
          Dica: prefira uma imagem com orientação &quot;Qualquer orientação&quot;,
          pois ela aparece em telas na horizontal e na vertical.
        </p>
      </fieldset>

      <p role="status" aria-live="polite" className="min-h-6 text-sm text-foreground/80">
        {message}
      </p>

      <div>
        <button
          type="submit"
          disabled={saving || selectedId === savedId}
          className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}