"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { sectorOptions } from "@/lib/sectors";
import { cleanTags, MAX_TAGS, validateExperience } from "@/lib/validation";
import type { ExperienceInput, FieldErrors } from "@/lib/validation";
import { createExperience, updateExperience, ValidationError } from "@/services/api";
import type { Experience, ExperienceSector } from "@/types/api";

type ExperienceFormProps = {
  experience?: Experience; // presente = modo edição
  screensInUse?: string[]; // nomes das telas com esta experiência atribuída
};

// Ordem dos campos na tela: usada para focar o primeiro com erro.
const fieldOrder: (keyof ExperienceInput)[] = [
  "title",
  "description",
  "url",
  "orientation",
  "sectors",
  "tags",
];

// No formulário as tags são digitadas separadas por vírgula.
function splitTags(text: string): string[] {
  return cleanTags(text.split(","));
}

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

export default function ExperienceForm({ experience, screensInUse = [] }: ExperienceFormProps) {
  const router = useRouter();
  const editing = experience !== undefined;
  const [values, setValues] = useState<ExperienceInput>({
    title: experience?.title ?? "",
    description: experience?.description ?? "",
    url: experience?.url ?? "",
    type: "web",
    orientation: experience?.orientation ?? "any",
    sectors: experience?.sectors ?? [],
    tags: experience?.tags ?? [],
  });
  const [tagsText, setTagsText] = useState((experience?.tags ?? []).join(", "));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  // Editar uma experiência em uso pede confirmação (US-07).
  const [confirming, setConfirming] = useState(false);

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

  function toggleSector(sector: ExperienceSector, checked: boolean) {
    const next = checked
      ? [...values.sectors, sector]
      : values.sectors.filter((item) => item !== sector);
    setField("sectors", next);
    setErrors((current) => ({
      ...current,
      sectors: validateExperience({ ...values, sectors: next }).sectors,
    }));
  }

  async function save() {
    setSaving(true);
    setFormError("");
    try {
      if (editing) await updateExperience(experience.id, values);
      else await createExperience(values);
      router.push("/experiences");
      router.refresh();
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors(error.fieldErrors);
      } else {
        setFormError("Não foi possível salvar. Tente novamente.");
      }
      setConfirming(false);
      setSaving(false);
    }
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
    if (editing && screensInUse.length > 0) {
      setConfirming(true);
      return;
    }
    await save();
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

      <fieldset
        aria-invalid={errors.sectors ? true : undefined}
        aria-describedby={errors.sectors ? "error-sectors" : undefined}
      >
        <legend className="mb-1 text-sm font-medium">Setores</legend>
        <div className="flex flex-wrap gap-2">
          {sectorOptions.map((option, index) => (
            <label
              key={option.value}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm ${
                errors.sectors ? "border-red-400" : "border-border"
              }`}
            >
              <input
                // O primeiro recebe o foco quando há erro.
                id={index === 0 ? "field-sectors" : undefined}
                type="checkbox"
                checked={values.sectors.includes(option.value)}
                onChange={(e) => toggleSector(option.value, e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              {option.label}
            </label>
          ))}
        </div>
        <FieldError id="error-sectors" message={errors.sectors} />
      </fieldset>

      <div>
        <label htmlFor="field-tags" className="mb-1 block text-sm font-medium">
          Tags (opcional)
        </label>
        <input
          id="field-tags"
          type="text"
          placeholder="ex.: segurança, dados"
          value={tagsText}
          onChange={(e) => {
            setTagsText(e.target.value);
            setField("tags", splitTags(e.target.value));
          }}
          onBlur={() => validateField("tags")}
          aria-invalid={errors.tags ? true : undefined}
          aria-describedby={errors.tags ? "error-tags" : "tags-hint"}
          className={inputClass(!!errors.tags)}
        />
        <FieldError id="error-tags" message={errors.tags} />
        <p id="tags-hint" className="mt-1 text-xs text-foreground/60">
          Separe por vírgula. Até {MAX_TAGS} tags.
        </p>
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-300">
          <span aria-hidden="true">⚠ </span>
          {formError}
        </p>
      )}

      {confirming ? (
        <div role="alert" className="rounded-md border border-amber-300/60 p-4">
          <p className="text-sm font-medium">
            {screensInUse.length === 1
              ? "Esta experiência está atribuída a 1 tela, que passa a exibir a versão nova:"
              : `Esta experiência está atribuída a ${screensInUse.length} telas, que passam a exibir a versão nova:`}
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {screensInUse.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar mesmo assim"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={saving}
              className="min-h-11 rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent"
            >
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Salvando..." : editing ? "Salvar alterações" : "Salvar experiência"}
          </button>
          <Link
            href="/experiences"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent"
          >
            Cancelar
          </Link>
        </div>
      )}
    </form>
  );
}