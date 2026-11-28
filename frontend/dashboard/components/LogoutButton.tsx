"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="min-h-11 rounded-md px-3 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
    >
      {busy ? "Saindo..." : "Sair"}
    </button>
  );
}