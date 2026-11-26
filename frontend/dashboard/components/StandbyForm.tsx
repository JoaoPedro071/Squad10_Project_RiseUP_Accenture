"use client";

import { Check, Save, Square } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { mediaUrl } from "@/lib/config";
import { orientationLabel } from "@/lib/orientation";
import { ui } from "@/lib/ui";
import { ApiError, setStandbyImage } from "@/services/api";
import type { Image } from "@/types/api";
import Notice from "./Notice";

type StandbyFormProps = {
  images: Image[]; // só as ativas
  initialStandbyId: string | null;
};

const NONE = "none"; // opção "sem imagem" (tela preta)

type Result = { variant: "success" | "error"; text: string } | null;

export default function StandbyForm({
  images,
  initialStandbyId,
}: StandbyFormProps) {
  const router = useRouter();
  const [savedId, setSavedId] = useState(initialStandbyId ?? NONE);
  const [selectedId, setSelectedId] = useState(initialStandbyId ?? NONE);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const settings = await setStandbyImage(
        selectedId === NONE ? null : selectedId,
      );
      setSavedId(settings.standbyImageId ?? NONE);
      setResult({
        variant: "success",
        text: "Concluído. As telas sem conteúdo já exibem o novo stand-by.",
      });
      router.refresh();
    } catch (error) {
      setResult({
        variant: "error",
        text:
          error instanceof ApiError
            ? error.message
            : "Não foi possível salvar. Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  }

  const optionClass =
    "interactive flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-border bg-surface p-3 hover:border-accent-light/60 has-[:checked]:border-accent has-[:checked]:bg-accent/15";

  const current = (id: string) =>
    id === savedId && (
      <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-accent-light">
        <Check aria-hidden="true" className="h-4 w-4" />
        Atual
      </span>
    );

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <fieldset className={ui.card}>
        <legend className="sr-only">Imagem de stand-by</legend>
        <h2 className="text-lg font-bold">Imagem de stand-by</h2>
        <p className="mt-1 text-sm text-muted">
          Exibida pelas telas ligadas que estão sem conteúdo.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <label className={optionClass}>
            <input
              type="radio"
              name="standby"
              value={NONE}
              checked={selectedId === NONE}
              onChange={() => setSelectedId(NONE)}
              className="h-4 w-4 accent-accent"
            />
            <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-black text-muted">
              <Square aria-hidden="true" className="h-4 w-4" />
            </span>
            <span>
              <span className="block font-bold">Nenhuma</span>
              <span className="block text-xs text-muted">Tela preta</span>
            </span>
            {current(NONE)}
          </label>

          {images.map((image) => (
            <label key={image.id} className={optionClass}>
              <input
                type="radio"
                name="standby"
                value={image.id}
                checked={selectedId === image.id}
                onChange={() => setSelectedId(image.id)}
                className="h-4 w-4 accent-accent"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(image.url)}
                alt=""
                className="h-12 w-20 shrink-0 rounded-md border border-border bg-black object-contain"
              />
              <span>
                <span className="block font-bold">{image.title}</span>
                <span className="block text-xs text-muted">
                  {orientationLabel[image.orientation]}
                </span>
              </span>
              {current(image.id)}
            </label>
          ))}
        </div>

        {images.length === 0 && (
          <p className="mt-3 text-sm text-muted">
            Nenhuma imagem ativa.{" "}
            <Link href="/images/new" className="text-accent-light underline">
              Cadastre uma imagem
            </Link>{" "}
            para usar como stand-by.
          </p>
        )}
        <p className={`${ui.hint} mt-3`}>
          Dica: prefira uma imagem com orientação &quot;Qualquer
          orientação&quot;, pois ela aparece em telas na horizontal e na
          vertical.
        </p>
      </fieldset>

      {result && <Notice variant={result.variant}>{result.text}</Notice>}

      <div>
        <button
          type="submit"
          disabled={saving || selectedId === savedId}
          className={ui.buttonPrimary}
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}