"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ui } from "@/lib/ui";
import { logout } from "@/services/api";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      await logout();
    } finally {
      // Mesmo se a API estiver fora do ar, volta para o login.
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={busy} className={ui.buttonGhost}>
      <LogOut aria-hidden="true" className="h-4 w-4" />
      {busy ? "Saindo..." : "Sair"}
    </button>
  );
}