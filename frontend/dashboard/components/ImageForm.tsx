"use client";

import Link from "next/link";
import { mediaUrl } from "@/lib/config";
import { inputClass, ui } from "@/lib/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import FieldError from "./FieldError";
import Notice from "./Notice";
import { validateImage } from "@/lib/validation";
import type { ImageFieldErrors, ImageInput } from "@/lib/validation";
import { createImage, updateImage, ValidationError } from "@/services/api";
import type { Image } from "@/types/api";

type ImageFormProps = {
  image?: Image; // presente = modo edição
};

// Ordem dos campos na tela: usada para focar o primeiro com erro.
const fieldOrder: (keyof ImageInput)[] = [
  "title",
  "description",
  "url",
  "orientation",
];

// Sugere a orientação pela proporção da imagem (quase quadrada = qualquer).
function orientationFromSize(
  width: number,
  height: number,
): ImageInput["orientation"] {
  const ratio = width / height;
  if (ratio > 1.1) return "landscape";
  if (ratio < 0.9) return "portrait";
  return "any";
}

export default function ImageForm({ image }: ImageFormProps) {
  const router = useRouter();
  const editing = image !== undefined;
  const [values, setValues] = useState<ImageInput>({
    title: image?.title ?? "",
    description: image?.description ?? "",
    url: image?.url ?? "",
    orientation: image?.orientation ?? "any",
  });
  const [errors, setErrors] = useState<ImageFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  // Na edição a prévia já começa carregada com a imagem atual.
  const [preview, setPreview] = useState<"loading" | "ok" | "error" | null>(
    editing ? "ok" : null,
  );

  function setField<K extends keyof ImageInput>(
    field: K,
    value: ImageInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  // Valida um campo só (ao sair dele).
  function validateField(field: keyof ImageInput) {
    const message = validateImage(values)[field];
    setErrors((current) => ({ ...current, [field]: message }));
  }

  // Ao sair do campo de endereço: carrega a imagem para a prévia e sugere a orientação.
  function handleUrlBlur() {
    validateField("url");
    const url = values.url.trim();
    if (!url || validateImage(values).url) {
      setPreview(null);
      return;
    }
    // Na edição, sem trocar o endereço, mantém a orientação escolhida.
    if (editing && url === image.url) {
      setPreview("ok");
      return;
    }
    setPreview("loading");
    const probe = new window.Image();
    probe.onload = () => {
      setPreview("ok");
      setField(
        "orientation",
        orientationFromSize(probe.naturalWidth, probe.naturalHeight),
      );
    };
    probe.onerror = () => setPreview("error");
    probe.src = mediaUrl(url);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const found = validateImage(values);
    setErrors(found);
    const firstInvalid = fieldOrder.find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(`field-${firstInvalid}`)?.focus();
      return;
    }

    setSaving(true);
    try {
      if (editing) await updateImage(image.id, values);
      else await createImage(values);
      router.push("/images");
      router.refresh();
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(error.fieldErrors);
      } else {
        setFormError("Não foi possível salvar. Tente novamente.");
      }
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex max-w-xl flex-col gap-4"
    >
      <div>
        <label htmlFor="field-title" className={ui.label}>
          Título
        </label>
        <input
          id="field-title"
          type="text"
          value={values.title}
          onChange={(e) => setField("title", e.target.value)}
          onBlur={() => validateField("title")}
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "error-title" : undefined}
          className={inputClass(!!errors.title)}
        />
        <FieldError id="error-title" message={errors.title} />
      </div>

      <div>
        <label htmlFor="field-description" className={ui.label}>
          Descrição (opcional)
        </label>
        <textarea
          id="field-description"
          rows={3}
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          onBlur={() => validateField("description")}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={
            errors.description ? "error-description" : undefined
          }
          className={`${inputClass(!!errors.description)} py-2`}
        />
        <FieldError id="error-description" message={errors.description} />
      </div>

      <div>
        <label htmlFor="field-url" className={ui.label}>
          Endereço da imagem
        </label>
        <input
          id="field-url"
          type="text"
          placeholder="https://..."
          value={values.url}
          onChange={(e) => setField("url", e.target.value)}
          onBlur={handleUrlBlur}
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={errors.url ? "error-url" : "url-hint"}
          className={inputClass(!!errors.url)}
        />
        <FieldError id="error-url" message={errors.url} />
        <p id="url-hint" className={ui.hint} aria-live="polite">
          {preview === "loading" && "Carregando a prévia..."}
          {preview === "ok" &&
            "Prévia carregada. A orientação foi sugerida pela proporção."}
          {preview === "error" &&
            "Não foi possível carregar a imagem. Confira o endereço; você ainda pode salvar."}
        </p>
        {preview === "ok" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(values.url.trim())}
            alt="Prévia da imagem"
            className="mt-2 h-40 w-full rounded-md border border-border bg-black object-contain"
          />
        )}
      </div>

      <div>
        <label htmlFor="field-orientation" className={ui.label}>
          Orientação
        </label>
        <select
          id="field-orientation"
          value={values.orientation}
          onChange={(e) =>
            setField("orientation", e.target.value as ImageInput["orientation"])
          }
          aria-invalid={errors.orientation ? true : undefined}
          aria-describedby={
            errors.orientation ? "error-orientation" : undefined
          }
          className={inputClass(!!errors.orientation)}
        >
          <option value="any">Qualquer orientação</option>
          <option value="landscape">Paisagem</option>
          <option value="portrait">Retrato</option>
        </select>
        <FieldError id="error-orientation" message={errors.orientation} />
      </div>

      {formError && <Notice variant="error">{formError}</Notice>}

      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={ui.buttonPrimary}>
          {saving
            ? "Salvando..."
            : editing
              ? "Salvar alterações"
              : "Salvar imagem"}
        </button>
        <Link href="/images" className={ui.buttonSecondary}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}