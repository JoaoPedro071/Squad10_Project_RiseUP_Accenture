"use client";

import Link from "next/link";
import { inputClass, ui } from "@/lib/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import FieldError from "./FieldError";
import Notice from "./Notice";
import { validateExperience } from "@/lib/validation";
import type { ExperienceInput, FieldErrors } from "@/lib/validation";
import {
  createExperience,
  updateExperience,
  ValidationError,
} from "@/services/api";
import type { Experience } from "@/types/api";

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
];

export default function ExperienceForm({
  experience,
  screensInUse = [],
}: ExperienceFormProps) {
  const router = useRouter();
  const editing = experience !== undefined;
  const [values, setValues] = useState<ExperienceInput>({
    title: experience?.title ?? "",
    description: experience?.description ?? "",
    url: experience?.url ?? "",
    type: "web",
    orientation: experience?.orientation ?? "any",
  });
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
        <label htmlFor="field-orientation" className={ui.label}>
          Orientação
        </label>
        <select
          id="field-orientation"
          value={values.orientation}
          onChange={(e) =>
            setField(
              "orientation",
              e.target.value as ExperienceInput["orientation"],
            )
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

      {confirming ? (
        <div
          role="alert"
          className="rounded-md border border-warning/40 bg-warning/10 p-4"
        >
          <p className="text-sm font-bold text-warning">
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
              className={ui.buttonPrimary}
            >
              {saving ? "Salvando..." : "Salvar mesmo assim"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={saving}
              className={ui.buttonSecondary}
            >
              Voltar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className={ui.buttonPrimary}>
            {saving
              ? "Salvando..."
              : editing
                ? "Salvar alterações"
                : "Salvar experiência"}
          </button>
          <Link href="/experiences" className={ui.buttonSecondary}>
            Cancelar
          </Link>
        </div>
      )}
    </form>
  );
}