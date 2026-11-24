"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ExperienceDisplay from "@/components/ExperienceDisplay";
import StatusScreen from "@/components/StatusScreen";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { API_URL } from "@/lib/config";
import type { DisplayState } from "@/types/api";

const POLL_INTERVAL_MS = 1500;

// O que o player sabe da conexão com o backend.
type Connection =
  | { kind: "connecting" } // ainda não recebeu nenhuma resposta
  | { kind: "ok"; display: DisplayState }
  | { kind: "unknown-screen" }; // o backend não conhece este id (404)

export default function DisplayController() {
  const clientId = useSearchParams().get("client");
  const [connection, setConnection] = useState<Connection>({
    kind: "connecting",
  });

  useHeartbeat(clientId);

  useEffect(() => {
    if (!clientId) return;
    const id = clientId;
    let cancelled = false;

    async function refresh() {
      try {
        const response = await fetch(
          `${API_URL}/api/clients/${encodeURIComponent(id)}/display`,
          { cache: "no-store" },
        );
        if (cancelled) return;
        if (response.status === 404) {
          setConnection({ kind: "unknown-screen" });
          return;
        }
        // Erro do servidor: mantém o que já está na tela.
        if (!response.ok) return;
        const display: DisplayState = await response.json();
        if (cancelled) return;
        // Só troca se mudou, para não recarregar a experiência à toa.
        setConnection((previous) =>
          previous.kind === "ok" &&
          JSON.stringify(previous.display) === JSON.stringify(display)
            ? previous
            : { kind: "ok", display },
        );
      } catch {
        // Sem conexão: mantém o último estado na tela e tenta de novo.
      }
    }

    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [clientId]);

  if (!clientId) {
    return (
      <StatusScreen
        title="Tela não identificada"
        detail="Abra o player com ?client=<id da tela>, por exemplo ?client=cli-1."
      />
    );
  }
  if (connection.kind === "unknown-screen") {
    return (
      <StatusScreen
        title="Tela não cadastrada"
        detail={`Nenhuma tela com o id "${clientId}" no sistema.`}
      />
    );
  }
  if (connection.kind === "connecting") {
    return <StatusScreen title="Conectando..." />;
  }

  return (
    <div className="cursor-none">
      <ExperienceDisplay state={connection.display} />
    </div>
  );
}
