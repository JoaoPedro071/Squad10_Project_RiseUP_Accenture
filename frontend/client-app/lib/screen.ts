import type { Orientation } from "@/types/api";

/** Lê do sistema operacional a orientação e a resolução da tela onde o
 * navegador está (já considerando a rotação configurada na máquina). */
export function readScreen(): { orientation: Orientation; resolution: string } {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.round(window.screen.width * ratio);
  const height = Math.round(window.screen.height * ratio);
  return {
    orientation: height > width ? "portrait" : "landscape",
    resolution: `${width}x${height}`,
  };
}