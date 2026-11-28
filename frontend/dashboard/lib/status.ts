import {
  CirclePause,
  MonitorCheck,
  MonitorPlay,
  PowerOff,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ScreenStatus } from "@/types/api";

// Rótulo, ícone e cor de cada estado (sempre juntos: nunca só a cor).
// A ordem é a da legenda.
export const statusConfig: Record<
  ScreenStatus,
  { icon: LucideIcon; label: string; style: string }
> = {
  busy: {
    icon: MonitorPlay,
    label: "Em uso",
    style: "text-status-busy border-status-busy/40 bg-status-busy/10",
  },
  standby: {
    // A tela está ligada e sem conteúdo (exibe a imagem de stand-by).
    icon: MonitorCheck,
    label: "Disponível",
    style: "text-status-available border-status-available/40 bg-status-available/10",
  },
  paused: {
    icon: CirclePause,
    label: "Em pausa",
    style: "text-status-paused border-status-paused/40 bg-status-paused/10",
  },
  error: {
    icon: TriangleAlert,
    label: "Erro",
    style: "text-status-error border-status-error/40 bg-status-error/10",
  },
  off: {
    icon: PowerOff,
    label: "Desligada",
    style: "text-status-off border-status-off/40 bg-status-off/10",
  },
};

export const statusOrder: ScreenStatus[] = ["busy", "standby", "paused", "error", "off"];