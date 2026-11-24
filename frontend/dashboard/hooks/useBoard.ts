"use client";

import { useEffect, useRef, useState } from "react";
import {
  ApiError,
  endFocus,
  fetchState,
  lockClient,
  moveClient,
  setContent,
  startFocus,
} from "@/services/api";
import type { Client, ContentUpdate, FocusState } from "@/types/api";

function errorMessage(error: unknown, fallback: string) {
  // O backend já responde em português (ex.: "A tela está offline").
  return error instanceof ApiError ? error.message : fallback;
}

// Nunca diz "Concluído" se a tela ainda não vai exibir a mudança.
function savedMessage(client: Client) {
  if (client.status === "off") {
    return `Salvo. ${client.name} exibirá o conteúdo quando voltar a se conectar.`;
  }
  if (client.status === "paused") {
    return `Salvo. ${client.name} exibirá o conteúdo ao sair do Modo foco.`;
  }
  return "Concluído. A tela atualiza em instantes.";
}

// Estado e ações compartilhados entre /clients e a planta (/).
// pollMs (opcional): atualiza as telas do servidor a cada N ms.
export function useBoard(
  initialClients: Client[],
  initialFocus: FocusState | null,
  pollMs?: number,
) {
  const [clients, setClients] = useState(initialClients);
  const [focus, setFocus] = useState(initialFocus);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [focusBusy, setFocusBusy] = useState(false);
  const [message, setMessage] = useState("");

  // Evita que uma atualização periódica antiga sobrescreva uma ação recente.
  const pending = useRef(0);
  const version = useRef(0);

  useEffect(() => {
    if (!pollMs) return;
    let cancelled = false;

    async function refresh() {
      if (pending.current > 0) return;
      const startedAt = version.current;
      try {
        const state = await fetchState();
        if (cancelled || pending.current > 0 || startedAt !== version.current) {
          return;
        }
        setClients(state.clients);
        setFocus(state.focus);
      } catch {
        // Sem conexão: mantém o último estado e tenta de novo.
      }
    }

    const timer = setInterval(refresh, pollMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pollMs]);

  async function track<T>(action: () => Promise<T>): Promise<T> {
    pending.current += 1;
    try {
      return await action();
    } finally {
      pending.current -= 1;
      version.current += 1;
    }
  }

  function replaceClient(updated: Client) {
    setClients((current) =>
      current.map((c) => (c.id === updated.id ? updated : c)),
    );
  }

  async function updateContent(clientId: string, update: ContentUpdate) {
    setBusyId(clientId);
    setMessage("Atualizando...");
    try {
      const updated = await track(() => setContent(clientId, update));
      replaceClient(updated);
      setMessage(savedMessage(updated));
    } catch (error) {
      setMessage(
        errorMessage(error, "Não foi possível trocar o conteúdo. Tente novamente."),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function move(clientId: string, x: number, y: number) {
    const previous = clients.find((c) => c.id === clientId);
    // Atualiza na hora; se falhar, volta para a posição anterior.
    setClients((current) =>
      current.map((c) => (c.id === clientId ? { ...c, x, y } : c)),
    );
    setMessage("Atualizando...");
    try {
      const updated = await track(() => moveClient(clientId, x, y));
      replaceClient(updated);
      setMessage("Concluído. Posição salva.");
    } catch (error) {
      if (previous) replaceClient(previous);
      setMessage(
        errorMessage(error, "Não foi possível salvar a posição. Tente novamente."),
      );
    }
  }

  async function lock(clientId: string, locked: boolean) {
    setBusyId(clientId);
    setMessage("Atualizando...");
    try {
      const updated = await track(() => lockClient(clientId, locked));
      replaceClient(updated);
      setMessage(
        locked
          ? "Concluído. Posição travada."
          : "Concluído. Posição destravada.",
      );
    } catch (error) {
      setMessage(
        errorMessage(error, "Não foi possível alterar o travamento. Tente novamente."),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function startFocusFor(clientId: string) {
    setFocusBusy(true);
    setMessage("Atualizando...");
    try {
      const result = await track(() => startFocus(clientId));
      setClients(result.clients);
      setFocus(result.focus);
      setMessage("Concluído. Modo foco ativo: as outras telas estão em pausa.");
    } catch (error) {
      setMessage(
        errorMessage(error, "Não foi possível ativar o Modo foco. Tente novamente."),
      );
    } finally {
      setFocusBusy(false);
    }
  }

  async function exitFocus() {
    setFocusBusy(true);
    setMessage("Atualizando...");
    try {
      const result = await track(() => endFocus());
      setClients(result.clients);
      setFocus(result.focus);
      setMessage("Concluído. Cada tela voltou ao seu conteúdo.");
    } catch (error) {
      setMessage(
        errorMessage(error, "Não foi possível sair do Modo foco. Tente novamente."),
      );
    } finally {
      setFocusBusy(false);
    }
  }

  return {
    clients,
    focus,
    busyId,
    focusBusy,
    message,
    updateContent,
    move,
    lock,
    notify: setMessage,
    startFocusFor,
    exitFocus,
  };
}