"use client";

import { useEffect, useRef, useState } from "react";
import type { Client } from "@/types/client";
import type { FocusState } from "@/types/focus";
import {
  assignExperience,
  endFocus,
  fetchState,
  lockClient,
  moveClient,
  setDisplayOff,
  startFocus,
} from "@/services/api";

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

  async function toggleDisplay(client: Client) {
    setBusyId(client.id);
    setMessage("Atualizando...");
    try {
      const updated = await track(() =>
        setDisplayOff(client.id, !client.displayOff),
      );
      replaceClient(updated);
      setMessage("Concluído. A tela atualiza em instantes.");
    } catch {
      setMessage("Não foi possível concluir a ação. Tente novamente.");
    } finally {
      setBusyId(null);
    }
  }

  async function assign(clientId: string, experienceId: string) {
    setBusyId(clientId);
    setMessage("Atualizando...");
    try {
      const updated = await track(() =>
        assignExperience(clientId, experienceId),
      );
      replaceClient(updated);
      setMessage("Concluído. A tela atualiza em instantes.");
    } catch {
      setMessage("Não foi possível trocar a experiência. Tente novamente.");
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
    } catch {
      if (previous) replaceClient(previous);
      setMessage("Não foi possível salvar a posição. Tente novamente.");
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
    } catch {
      setMessage("Não foi possível alterar o travamento. Tente novamente.");
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
      const offline = result.focus?.offlineIds.length ?? 0;
      setMessage(
        offline > 0
          ? `Modo foco ativo, parcial: ${offline} tela(s) offline não foram apagadas.`
          : "Concluído. Modo foco ativo.",
      );
    } catch {
      setMessage("Não foi possível ativar o modo foco. Tente novamente.");
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
      setMessage("Concluído. As telas foram restauradas.");
    } catch {
      setMessage("Não foi possível sair do modo foco. Tente novamente.");
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
    toggleDisplay,
    assign,
    move,
    lock,
    notify: setMessage,
    startFocusFor,
    exitFocus,
  };
}
