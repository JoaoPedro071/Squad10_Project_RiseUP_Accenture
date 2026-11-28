"use client";

import { useSearchParams } from "next/navigation";
import ExperienceDisplay from "@/components/ExperienceDisplay";
import IdentifyOverlay from "@/components/IdentifyOverlay";
import StatusScreen from "@/components/StatusScreen";
import { usePlayerSocket } from "@/hooks/usePlayerSocket";

export default function DisplayController() {
  const clientId = useSearchParams().get("client");
  const { status, display, identify } = usePlayerSocket(clientId);

  if (!clientId) {
    return (
      <StatusScreen
        title="Tela não identificada"
        detail="Abra o player com ?client=<id da tela>, por exemplo ?client=cli-1."
      />
    );
  }
  if (status === "unknown-screen") {
    return (
      <StatusScreen
        title="Tela não cadastrada"
        detail={`Nenhuma tela com o id "${clientId}" no sistema.`}
      />
    );
  }
  if (!display) {
    return (
      <StatusScreen
        title={status === "reconnecting" ? "Reconectando..." : "Conectando..."}
        detail={status === "reconnecting" ? "Sem conexão com o servidor." : undefined}
      />
    );
  }

  return (
    <div className="cursor-none">
      <ExperienceDisplay state={display.state} />
      {status === "reconnecting" && (
        // Discreto: o conteúdo continua na tela enquanto reconecta.
        <p
          role="status"
          className="fixed right-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white/70"
        >
          Reconectando...
        </p>
      )}
      {identify && <IdentifyOverlay number={identify.number} name={identify.name} />}
    </div>
  );
}