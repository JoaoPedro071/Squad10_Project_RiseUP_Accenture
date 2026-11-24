"use client";

import { useEffect, useRef, useState } from "react";
import { CLIENT_APP_URL } from "@/lib/config";
import { contentLabel, pendingNote } from "@/lib/content";
import {
  isIncompatible,
  orientationLabel,
  screenOrientationText,
} from "@/lib/orientation";
import type {
  Client,
  ContentOrientation,
  ContentUpdate,
  Experience,
  Image,
} from "@/types/api";
import StatusBadge from "./StatusBadge";

const secondaryButton =
  "min-h-11 rounded-md border border-border px-4 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton =
  "min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";
const optionButton =
  "flex min-h-11 w-full flex-col items-start rounded-md border p-3 text-left text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50";

type Item = { id: string; title: string; orientation: ContentOrientation };
type Pending = { item: Item; update: ContentUpdate };

type ScreenModalProps = {
  client: Client;
  experiences: Experience[];
  images: Image[];
  busy: boolean;
  focusActive: boolean;
  onClose: () => void;
  onUpdate: (update: ContentUpdate) => void;
  onFocus: () => void;
};

export default function ScreenModal({
  client,
  experiences,
  images,
  busy,
  focusActive,
  onClose,
  onUpdate,
  onFocus,
}: ScreenModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Conteúdo com orientação diferente da tela, aguardando confirmação.
  const [pending, setPending] = useState<Pending | null>(null);

  // Abre o <dialog> assim que o componente aparece.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  const currentExperience = experiences.find(
    (e) => e.id === client.currentExperienceId,
  );
  const currentImage = images.find((i) => i.id === client.imgId);
  const note = pendingNote(client);

  function choose(item: Item, update: ContentUpdate) {
    if (isIncompatible(client, item)) {
      setPending({ item, update });
      return;
    }
    setPending(null);
    onUpdate(update);
  }

  function renderOptions(
    items: Item[],
    currentId: string | null,
    toUpdate: (id: string) => ContentUpdate,
  ) {
    return (
      <ul className="mt-2 flex flex-col gap-2">
        {items.map((item) => {
          const isCurrent = item.id === currentId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => choose(item, toUpdate(item.id))}
                disabled={busy}
                aria-current={isCurrent ? "true" : undefined}
                className={`${optionButton} ${isCurrent ? "border-accent" : "border-border"}`}
              >
                <span className="font-medium">
                  {item.title}
                  {isCurrent && " (atribuída)"}
                </span>
                <span className="text-xs text-foreground/70">
                  {orientationLabel[item.orientation]}
                  {isIncompatible(client, item) && (
                    <span className="ml-2 text-yellow-300">
                      <span aria-hidden="true">⚠ </span>
                      Orientação diferente da tela
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="screen-title"
      className="m-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-surface p-6 text-foreground backdrop:bg-black/60"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 id="screen-title" className="text-lg font-semibold">
          {client.name}
        </h2>
        <StatusBadge status={client.status} />
      </div>
      <p className="mt-2 text-sm text-foreground/80">
        Exibindo: {contentLabel(client, { experiences, images })}
      </p>
      <p className="mt-1 text-xs text-foreground/60">
        {screenOrientationText(client)}
        {client.orientationMismatch && (
          <span className="ml-2 text-orange-400">
            <span aria-hidden="true">⚠ </span>
            Não combina com o conteúdo exibido
          </span>
        )}
      </p>
      {note && <p className="mt-2 text-xs text-yellow-300">{note}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {currentExperience && currentImage && (
          <button
            type="button"
            onClick={() => onUpdate({ displayImg: !client.displayImg })}
            disabled={busy}
            className={secondaryButton}
          >
            {client.displayImg ? "Exibir a experiência" : "Exibir a imagem"}
          </button>
        )}
        <button
          type="button"
          onClick={onFocus}
          disabled={busy || client.status === "off" || focusActive}
          className={secondaryButton}
        >
          Modo foco
        </button>
        <a
          href={`${CLIENT_APP_URL}/?client=${client.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-purple-300 underline hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Abrir tela
        </a>
      </div>

      <h3 className="mt-5 text-sm font-semibold">Experiência</h3>
      {renderOptions(
        experiences.filter((e) => e.active),
        client.currentExperienceId,
        (id) => ({ experienceId: id }),
      )}
      {currentExperience && (
        <button
          type="button"
          onClick={() => onUpdate({ experienceId: null })}
          disabled={busy}
          className={`${secondaryButton} mt-2`}
        >
          Remover experiência
        </button>
      )}

      <h3 className="mt-5 text-sm font-semibold">Imagem</h3>
      {renderOptions(
        images.filter((i) => i.active),
        client.imgId,
        (id) => ({ imgId: id }),
      )}
      {currentImage && (
        <button
          type="button"
          onClick={() => onUpdate({ imgId: null })}
          disabled={busy}
          className={`${secondaryButton} mt-2`}
        >
          Remover imagem
        </button>
      )}

      {pending && (
        <div
          role="alert"
          className="mt-3 rounded-md border border-yellow-300/50 p-3 text-sm text-yellow-300"
        >
          <p>
            <span aria-hidden="true">⚠ </span>
            {pending.item.title} é em{" "}
            {orientationLabel[pending.item.orientation].toLowerCase()} e a tela
            está em{" "}
            {client.reportedOrientation
              ? orientationLabel[client.reportedOrientation].toLowerCase()
              : "outra orientação"}
            . O conteúdo pode aparecer cortado ou com bordas.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onUpdate(pending.update);
                setPending(null);
              }}
              className={primaryButton}
            >
              Aplicar assim mesmo
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className={secondaryButton}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className={secondaryButton}>
          Fechar
        </button>
      </div>
    </dialog>
  );
}