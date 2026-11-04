import type { Client } from "@/types/client";

// Decide o que o Modo foco faria, sem alterar nada.
// Usado na prévia (modal) e no servidor, para as duas concordarem.
// Escritório aberto: todas as outras telas entram, sem filtro de sala.
export function planFocus(clients: Client[], focusedId: string) {
  const focused = clients.find((c) => c.id === focusedId);
  if (!focused) return null;

  const others = clients.filter((c) => c.id !== focused.id);

  return {
    focused,
    toDarken: others.filter((c) => c.status === "online" && !c.displayOff),
    offline: others.filter((c) => c.status === "offline"),
    alreadyOff: others.filter((c) => c.status === "online" && c.displayOff),
  };
}