"use client";

import { useEffect, useRef, useState } from "react";
import { loginUrl, WS_URL } from "@/lib/config";
import {
  ApiError,
  endFocus,
  identifyScreens,
  lockClient,
  moveClient,
  setContent,
  startFocus,
} from "@/services/api";
import type { Client, ContentUpdate, DashboardMessage, FocusState } from "@/types/api";

const FIRST_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;
const ACK_TIMEOUT_MS = 5000; // tempo para a tela confirmar que exibiu a mudança

function errorMessage(error: unknown, fallback: string) {
  // O backend já responde em português (ex.: "A tela está offline").
  return error instanceof ApiError ? error.message : fallback;
}

// Tela desligada ou em pausa não vai exibir agora: não espera confirmação.
function notNowMessage(client: Client): string | null {
  if (client.status === "off") {
    return `Salvo. ${client.name} exibirá o conteúdo quando voltar a se conectar.`;
  }
  if (client.status === "paused") {
    return `Salvo. ${client.name} exibirá o conteúdo ao sair do Modo foco.`;
  }
  return null;
}

const doneMessage = (name: string) => `Concluído. ${name} já está exibindo o novo conteúdo.`;

// Troca de conteúdo esperando a confirmação da tela (US-12).
type Waiting = {
  clientId: string;
  acked: boolean; // a tela já confirmou
  responded: boolean; // o backend já respondeu ao PUT
};

// Estado e ações compartilhados entre /clients e a planta (/).
// Recebe as atualizações do backend em tempo real (WebSocket).
export function useBoard(initialClients: Client[], initialFocus: FocusState | null) {
  const [clients, setClients] = useState(initialClients);
  const [focus, setFocus] = useState(initialFocus);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [focusBusy, setFocusBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [live, setLive] = useState(true); // conexão em tempo real ativa
  // Modo de identificação: número de cada tela (some sozinho).
  const [numbers, setNumbers] = useState<Record<string, number> | null>(null);

  const waiting = useRef<Waiting | null>(null);
  const namesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    namesRef.current = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  }, [clients]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryMs = FIRST_RETRY_MS;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let numbersTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    function connect() {
      socket = new WebSocket(`${WS_URL}/ws/dashboard`);
      socket.onopen = () => {
        retryMs = FIRST_RETRY_MS;
        setLive(true);
      };
      socket.onmessage = (event) => {
        let data: DashboardMessage;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        if (data.type === "state") {
          setClients(data.clients);
          setFocus(data.focus);
        } else if (data.type === "ack") {
          const current = waiting.current;
          if (current?.clientId !== data.clientId) return;
          current.acked = true;
          if (current.responded) {
            waiting.current = null;
            setMessage(doneMessage(namesRef.current[data.clientId] ?? "A tela"));
          }
        } else if (data.type === "identify") {
          setNumbers(data.numbers);
          clearTimeout(numbersTimer);
          numbersTimer = setTimeout(() => setNumbers(null), data.seconds * 1000);
        }
      };
      socket.onclose = (event) => {
        if (stopped) return;
        if (event.code === 4401) {
          // Sessão expirou: volta para o login.
          window.location.assign(loginUrl(window.location.pathname));
          return;
        }
        setLive(false);
        retryTimer = setTimeout(connect, retryMs);
        retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
      };
    }

    connect();
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      clearTimeout(numbersTimer);
      socket?.close();
    };
  }, []);

  function replaceClient(updated: Client) {
    setClients((current) =>
      current.map((c) => (c.id === updated.id ? updated : c)),
    );
  }

  async function updateContent(clientId: string, update: ContentUpdate) {
    setBusyId(clientId);
    setMessage("Atualizando...");
    const mine: Waiting = { clientId, acked: false, responded: false };
    waiting.current = mine;
    try {
      const updated = await setContent(clientId, update);
      replaceClient(updated);
      if (waiting.current !== mine) return; // já houve outra troca depois desta
      const note = notNowMessage(updated);
      if (note) {
        waiting.current = null;
        setMessage(note);
        return;
      }
      mine.responded = true;
      if (mine.acked) {
        waiting.current = null;
        setMessage(doneMessage(updated.name));
        return;
      }
      setTimeout(() => {
        if (waiting.current !== mine) return;
        waiting.current = null;
        setMessage(
          `Salvo, mas ${updated.name} não confirmou o recebimento. Confira se a tela está aberta.`,
        );
      }, ACK_TIMEOUT_MS);
    } catch (error) {
      if (waiting.current === mine) waiting.current = null;
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
      replaceClient(await moveClient(clientId, x, y));
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
      replaceClient(await lockClient(clientId, locked));
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
      const result = await startFocus(clientId);
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
      const result = await endFocus();
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

  async function identify() {
    try {
      const result = await identifyScreens();
      setMessage(
        `Identificando: cada tela conectada mostra o seu número por ${result.seconds} s.`,
      );
    } catch (error) {
      setMessage(
        errorMessage(error, "Não foi possível identificar as telas. Tente novamente."),
      );
    }
  }

  return {
    clients,
    focus,
    busyId,
    focusBusy,
    message,
    live,
    numbers,
    updateContent,
    move,
    lock,
    notify: setMessage,
    startFocusFor,
    exitFocus,
    identify,
  };
}