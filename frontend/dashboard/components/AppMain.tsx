"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function AppMain({ children }: { children: ReactNode }) {
  // A planta (/) ocupa toda a área abaixo da barra superior.
  const fullScreen = usePathname() === "/";

  return (
    <main
      className={
        fullScreen
          ? "flex min-h-0 w-full flex-1 flex-col p-3"
          : "mx-auto w-full max-w-5xl p-6"
      }
    >
      {children}
    </main>
  );
}