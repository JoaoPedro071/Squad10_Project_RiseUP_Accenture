"use client";

import {
  Check,
  Clapperboard,
  Clock,
  ExternalLink,
  Focus,
  Image as ImageIcon,
  Maximize2,
  Monitor,
  Repeat,
  RotateCw,
  TriangleAlert,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CLIENT_APP_URL } from "@/lib/config";
import { contentLabel, pendingNote } from "@/lib/content";
import {
  isIncompatible,
  lastSeenText,
  orientationLabel,
} from "@/lib/orientation";
import { ui } from "@/lib/ui";
import type {
  Client,
  ContentOrientation,
  ContentUpdate,
  Experience,
  Image,
} from "@/types/api";
import Notice from "./Notice";
import StatusBadge from "./StatusBadge";

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

const sectionTitle =
  "mb-2 text-xs font-bold tracking-wide text-muted uppercase";

// Detalhes da tela (layout do protótipo aprovado): à esquerda o que a tela
// informou sozinha; à direita, a escolha do conteúdo. Sem ações de monitor.
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
    if (dialog && !dialog.open) dialog.showModal();
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
    icon: LucideIcon,
    toUpdate: (id: string) => ContentUpdate,
  ) {
    const Icon = icon;
    if (items.length === 0) {
      return (
        <p className="text-sm text-muted">Nenhum item ativo no catálogo.</p>
      );
    }
    return (
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const isCurrent = item.id === currentId;
          const incompatible = isIncompatible(client, item);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => choose(item, toUpdate(item.id))}
                disabled={busy}
                aria-current={isCurrent ? "true" : undefined}
                className={`interactive flex min-h-14 w-full items-center gap-3 rounded-md border p-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
                  isCurrent
                    ? "border-accent bg-accent/15"
                    : "border-border bg-surface hover:border-accent-light/60 hover:bg-card"
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-accent-light">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{item.title}</span>
                  <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                    {orientationLabel[item.orientation]}
                    {incompatible && (
                      <span className="inline-flex items-center gap-1 text-status-error">
                        <TriangleAlert
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                        />
                        Orientação diferente da tela
                      </span>
                    )}
                  </span>
                </span>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-light">
                    <Check aria-hidden="true" className="h-4 w-4" />
                    Atribuída
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  const details = [
    {
      icon: RotateCw,
      label: "Orientação",
      value: client.reportedOrientation
        ? orientationLabel[client.reportedOrientation]
        : "Não informada",
      warn: client.orientationMismatch,
    },
    {
      icon: Maximize2,
      label: "Resolução",
      value: client.reportedResolution ?? "Não informada",
    },
    { icon: Clock, label: "Último contato", value: lastSeenText(client) },
  ];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="screen-title"
      className="relative m-auto max-h-[90vh] w-[94vw] max-w-4xl overflow-hidden rounded-lg border border-border bg-card p-0 text-foreground backdrop:bg-black/70"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="interactive absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-md bg-card text-muted hover:bg-accent/10 hover:text-foreground"
      >
        <X aria-hidden="true" className="h-5 w-5" />
      </button>

      {/* No celular a janela inteira rola; no computador, só a coluna da direita. */}
      <div className="flex max-h-[90vh] flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        {/* Esquerda: a tela e o que ela informou */}
        <section className="flex shrink-0 flex-col gap-5 border-b border-border p-5 md:w-80 md:border-r md:border-b-0">
          <div className="flex items-center gap-3 pr-10 md:pr-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent-light">
              <Monitor aria-hidden="true" className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <h2 id="screen-title" className="truncate text-xl font-bold">
                {client.name}
              </h2>
              <StatusBadge status={client.status} />
            </div>
          </div>

          <div>
            <h3 className={sectionTitle}>Exibindo</h3>
            <p className="text-sm">
              {contentLabel(client, { experiences, images })}
            </p>
            {note && (
              <Notice variant="warning" className="mt-2">
                {note}
              </Notice>
            )}
          </div>

          <div>
            <h3 className={sectionTitle}>Detalhes da tela</h3>
            <dl className="space-y-2.5 text-sm">
              {details.map(({ icon: Icon, label, value, warn }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-accent-light"
                  />
                  <dt className="text-muted">{label}</dt>
                  <dd className="ml-auto flex items-center gap-1 font-bold">
                    {warn && (
                      <TriangleAlert
                        aria-label="Erro de configuração"
                        className="h-4 w-4 text-status-error"
                      />
                    )}
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className={ui.hint}>
              Informado automaticamente pela máquina ligada à tela.
            </p>
            {client.orientationMismatch && (
              <Notice variant="warning" className="mt-2">
                A orientação da máquina não combina com o conteúdo exibido. Gire
                a tela na máquina ou escolha outro conteúdo.
              </Notice>
            )}
          </div>

          <div className="mt-auto flex flex-wrap gap-2">
            {currentExperience && currentImage && (
              <button
                type="button"
                onClick={() => onUpdate({ displayImg: !client.displayImg })}
                disabled={busy}
                className={ui.buttonSecondary}
              >
                <Repeat aria-hidden="true" className="h-4 w-4" />
                {client.displayImg ? "Exibir a experiência" : "Exibir a imagem"}
              </button>
            )}
            <button
              type="button"
              onClick={onFocus}
              disabled={busy || client.status === "off" || focusActive}
              className={ui.buttonSecondary}
            >
              <Focus aria-hidden="true" className="h-4 w-4" />
              Modo foco
            </button>
            <a
              href={`${CLIENT_APP_URL}/?client=${client.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={ui.buttonGhost}
            >
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              Abrir tela
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
          </div>
        </section>

        {/* Direita: escolha do conteúdo */}
        <section className="min-h-0 flex-1 p-5 md:overflow-y-auto">
          {pending && (
            <Notice variant="warning" className="mb-4 mr-12">
              <p>
                {pending.item.title} é em{" "}
                {orientationLabel[pending.item.orientation].toLowerCase()} e a
                tela está em{" "}
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
                  className={ui.buttonPrimary}
                >
                  Aplicar assim mesmo
                </button>
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  className={ui.buttonSecondary}
                >
                  Cancelar
                </button>
              </div>
            </Notice>
          )}

          <div className="mb-2 flex items-center justify-between gap-2 pr-12">
            <h3 className={`${sectionTitle} mb-0`}>Escolher experiência</h3>
            {currentExperience && (
              <button
                type="button"
                onClick={() => onUpdate({ experienceId: null })}
                disabled={busy}
                className={`${ui.buttonGhost} min-h-9 px-2 text-xs`}
              >
                Remover experiência
              </button>
            )}
          </div>
          {renderOptions(
            experiences.filter((e) => e.active),
            client.currentExperienceId,
            Clapperboard,
            (id) => ({ experienceId: id }),
          )}

          <div className="mt-6 mb-2 flex items-center justify-between gap-2">
            <h3 className={`${sectionTitle} mb-0`}>Escolher imagem</h3>
            {currentImage && (
              <button
                type="button"
                onClick={() => onUpdate({ imgId: null })}
                disabled={busy}
                className={`${ui.buttonGhost} min-h-9 px-2 text-xs`}
              >
                Remover imagem
              </button>
            )}
          </div>
          {renderOptions(
            images.filter((i) => i.active),
            client.imgId,
            ImageIcon,
            (id) => ({ imgId: id }),
          )}
          <p className={`${ui.hint} mt-4`}>
            Sem experiência nem imagem, a tela exibe o stand-by.
          </p>
        </section>
      </div>
    </dialog>
  );
}