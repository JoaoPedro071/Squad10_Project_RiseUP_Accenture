"use client";

import { useEffect } from "react";
import { API_URL } from "@/lib/config";
import type { Heartbeat } from "@/types/api";

const HEARTBEAT_INTERVAL_MS = 5000; // o backend considera a tela desligada após 15 s

// Lê do sistema operacional: a orientação e a resolução da tela onde o
// navegador está (já considerando a rotação configurada na máquina).
function readScreen(): Heartbeat {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.round(window.screen.width * ratio);
  const height = Math.round(window.screen.height * ratio);
  return {
    orientation: height > width ? "portrait" : "landscape",
    resolution: `${width}x${height}`,
  };
}

/** Avisa o backend, a cada 5 s, que esta tela está ligada e como está. */
export function useHeartbeat(clientId: string | null) {
  useEffect(() => {
    if (!clientId) return;
    const url = `${API_URL}/api/clients/${encodeURIComponent(clientId)}/heartbeat`;

    function send() {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(readScreen()),
      }).catch(() => {
        // Sem conexão: o próximo aviso tenta de novo.
      });
    }

    send();
    const timer = setInterval(send, HEARTBEAT_INTERVAL_MS);
    // Se a orientação ou a resolução mudar, avisa na hora.
    window.addEventListener("resize", send);
    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", send);
    };
  }, [clientId]);
}