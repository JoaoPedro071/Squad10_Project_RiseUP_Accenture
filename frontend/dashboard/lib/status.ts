import type { ScreenStatus } from "@/types/api";

// Rótulo, ícone e cor de cada estado (sempre juntos: nunca só cor).
export const statusConfig: Record<
  ScreenStatus,
  { icon: string; label: string; style: string }
> = {
  busy: { icon: "●", label: "Em uso", style: "text-green-400 border-green-400/50" },
  standby: { icon: "◐", label: "Stand-by", style: "text-purple-300 border-purple-300/50" },
  paused: { icon: "❚❚", label: "Em pausa", style: "text-yellow-300 border-yellow-300/50" },
  error: { icon: "⚠", label: "Erro", style: "text-orange-400 border-orange-400/50" },
  off: { icon: "○", label: "Desligada", style: "text-foreground/50 border-foreground/30" },
};