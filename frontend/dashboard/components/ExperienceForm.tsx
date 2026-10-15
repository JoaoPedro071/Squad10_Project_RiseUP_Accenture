"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { validateExperience } from "@/lib/validation";
import type { ExperienceInput, FieldErrors } from "@/lib/validation";
import { createExperience, ValidationError } from "@/services/api";

const initialValues: ExperienceInput = {
  title: "",
  description: "",
  url: "",
  type: "web",
  orientation: "any",
};

// Ordem dos campos na tela: usada para focar o primeiro com erro.
const fieldOrder: (keyof ExperienceInput)[] = [
  "title",
  "description",
  "url",
  "type",
  "orientation",
];

function inputClass(hasError: boolean) {
  return `min-h-11 w-full rounded-md border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-accent ${
    hasError ? "border-red-400" : "border-border"
  }`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-red-300">
      <span aria-hidden="true">⚠ </span>
      {message}
    </p>
  );
}

export default function ExperienceForm() {
  const router = useRouter();
  const [values, setValues] = useState<ExperienceInput>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function setField<K extends keyof ExperienceInput>(
    field: K,
    value: ExperienceInput[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  // Valida um campo só (ao sair dele).
  function validateField(field: keyof ExperienceInput) {
    const message = validateExperience(values)[field];
    setErrors((current) => ({ ...current, [field]: message }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const found = validateExperience(values);
    setErrors(found);
    const firstInvalid = fieldOrder.find((field) => found[field]);
    if (firstInvalid) {
      document.getElementById(`field-${firstInvalid}`)?.focus();
      return;
    }

    setSaving(true);
    try {
      await createExperience(values);
      router.push("/experiences");
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
    <form onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-4">
      <div>
        <label htmlFor="field-title" className="mb-1 block text-sm font-medium">
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
        <label htmlFor="field-description" className="mb-1 block text-sm font-medium">
          Descrição (opcional)
        </label>
        <textarea
          id="field-description"
          rows={3}
          value={values.description}
          onChange={(e) => setField("description", e.target.value)}
          onBlur={() => validateField("description")}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "error-description" : undefined}
          className={`${inputClass(!!errors.description)} py-2`}
        />
        <FieldError id="error-description" message={errors.description} />
      </div>

      <div>
        <label htmlFor="field-url" className="mb-1 block text-sm font-medium">
          Endereço do conteúdo
        </label>
        <input
          id="field-url"
          type="text"
          placeholder="https://..."
          value={values.url}
          onChange={(e) => setField("url", e.target.value)}
          onBlur={() => validateField("url")}
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={errors.url ? "error-url" : undefined}
          className={inputClass(!!errors.url)}
        />
        <FieldError id="error-url" message={errors.url} />
      </div>

      <div>
        <label htmlFor="field-type" className="mb-1 block text-sm font-medium">
          Tipo de conteúdo
        </label>
        <select
          id="field-type"
          value={values.type}
          onChange={(e) => setField("type", e.target.value as ExperienceInput["type"])}
          aria-invalid={errors.type ? true : undefined}
          aria-describedby={errors.type ? "error-type" : undefined}
          className={inputClass(!!errors.type)}
        >
          <option value="web">Página web</option>
          <option value="image">Imagem</option>
        </select>
        <FieldError id="error-type" message={errors.type} />
      </div>

      <div>
        <label htmlFor="field-orientation" className="mb-1 block text-sm font-medium">
          Orientação
        </label>
        <select
          id="field-orientation"
          value={values.orientation}
          onChange={(e) =>
            setField("orientation", e.target.value as ExperienceInput["orientation"])
          }
          aria-invalid={errors.orientation ? true : undefined}
          aria-describedby={errors.orientation ? "error-orientation" : undefined}
          className={inputClass(!!errors.orientation)}
        >
          <option value="any">Qualquer orientação</option>
          <option value="landscape">Paisagem</option>
          <option value="portrait">Retrato</option>
        </select>
        <FieldError id="error-orientation" message={errors.orientation} />
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-300">
          <span aria-hidden="true">⚠ </span>
          {formError}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar experiência"}
        </button>
        <Link
          href="/experiences"
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}