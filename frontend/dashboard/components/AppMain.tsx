"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ui } from "@/lib/ui";

export default function AppMain({ children }: { children: ReactNode }) {
  // A planta (/) ocupa toda a altura abaixo da barra superior. Todas as
  // páginas usam a mesma coluna do cabeçalho (ui.container).
  const fullScreen = usePathname() === "/";

  return (
    <main
      className={`${ui.container} ${
        fullScreen ? "flex min-h-0 flex-1 flex-col py-4" : "py-8"
      }`}
    >
      {children}
    </main>
  );
}