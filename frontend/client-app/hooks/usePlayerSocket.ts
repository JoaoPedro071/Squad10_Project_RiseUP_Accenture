"use client";

import { useEffect, useRef, useState } from "react";
import { WS_URL } from "@/lib/config";
import { readScreen } from "@/lib/screen";
import type { DisplayState, ServerMessage } from "@/types/api";

const HEARTBEAT_INTERVAL_MS = 5000; // o backend considera a tela desligada após 15 s
const FIRST_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;
const UNKNOWN_SCREEN = 4404; // código de fechamento enviado pelo backend

export type SocketStatus = "connecting" | "open" | "reconnecting" | "unknown-screen";
export type Display = { version: number; state: DisplayState };
export type Identify = { number: number; name: string; seconds: number };

/**
 * Conexão da tela com o backend (WebSocket):
 * - recebe o que exibir assim que algo muda;
 * - envia o sinal de vida a cada 5 s (e quando a tela gira ou muda de tamanho);
 * - confirma cada mudança depois de desenhá-la;
 * - se a conexão cair, tenta de novo com espera crescente (1 s, 2 s, 4 s... até 30 s),
 *   mantendo o último conteúdo na tela.
 */
export function usePlayerSocket(clientId: string | null) {
  const [status, setStatus] = useState<SocketStatus>("connecting");
  const [display, setDisplay] = useState<Display | null>(null);
  const [identify, setIdentify] = useState<Identify | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!clientId) return;
    const url = `${WS_URL}/ws/player/${encodeURIComponent(clientId)}`;
    let socket: WebSocket | null = null;
    let retryMs = FIRST_RETRY_MS;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    function send(message: object) {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
    }
    function sendHeartbeat() {
      send({ type: "heartbeat", ...readScreen() });
    }

    function connect() {
      socket = new WebSocket(url);
      socketRef.current = socket;
      socket.onopen = () => {
        retryMs = FIRST_RETRY_MS;
        setStatus("open");
        sendHeartbeat();
      };
      socket.onmessage = (event) => {
        let message: ServerMessage;
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        if (message.type === "display") {
          setDisplay({ version: message.version, state: message.state });
        } else if (message.type === "identify") {
          setIdentify({ number: message.number, name: message.name, seconds: message.seconds });
        }
      };
      socket.onclose = (event) => {
        if (stopped) return;
        if (event.code === UNKNOWN_SCREEN) {
          setStatus("unknown-screen");
          return;
        }
        setStatus("reconnecting");
        retryTimer = setTimeout(connect, retryMs);
        retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
      };
    }

    connect();
    const heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    window.addEventListener("resize", sendHeartbeat);
    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      clearInterval(heartbeatTimer);
      window.removeEventListener("resize", sendHeartbeat);
      socket?.close();
    };
  }, [clientId]);

  // Depois que a mudança aparece na tela, confirma ao backend (o dashboard mostra "Concluído").
  useEffect(() => {
    const socket = socketRef.current;
    if (display && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ack", version: display.version }));
    }
  }, [display]);

  // A identificação some sozinha depois do tempo informado.
  useEffect(() => {
    if (!identify) return;
    const timer = setTimeout(() => setIdentify(null), identify.seconds * 1000);
    return () => clearTimeout(timer);
  }, [identify]);

  return { status, display, identify };
}