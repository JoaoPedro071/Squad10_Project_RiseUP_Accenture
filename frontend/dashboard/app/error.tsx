"use client"; // Telas de erro precisam rodar no navegador.

import { RefreshCw, ServerCrash } from "lucide-react";
import StatePage from "@/components/StatePage";
import { API_URL } from "@/lib/config";
import { ui } from "@/lib/ui";

export default function Error({ retry }: { error: Error; retry: () => void }) {
  return (
    <StatePage icon={ServerCrash} title="Não foi possível carregar os dados">
      <p>Verifique se o backend está rodando em {API_URL} e tente novamente.</p>
      <button
        type="button"
        onClick={() => retry()}
        className={ui.buttonPrimary}
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        Tentar novamente
      </button>
    </StatePage>
  );
}