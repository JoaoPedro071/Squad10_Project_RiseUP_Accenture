"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ui } from "@/lib/ui";
import ClientFormModal from "./ClientFormModal";

// Botão "Nova tela" do cabeçalho da página Telas (só Coordenação).
// A tela nova aparece na lista sozinha, pelo WebSocket.
export default function NewClientButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={ui.buttonPrimary}
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Nova tela
      </button>
      {open && <ClientFormModal onClose={() => setOpen(false)} />}
    </>
  );
}
