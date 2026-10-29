import type { Client } from "@/types/client";

// Decide o que o Modo foco faria, sem alterar nada.
// Usado na prévia (modal) e no servidor, para as duas concordarem.
export function planFocus(clients: Client[], focusedId: string) {
  const focused = clients.find((c) => c.id === focusedId);
  if (!focused) return null;

  const sameRoom = clients.filter(
    (c) => c.room === focused.room && c.id !== focused.id,
  );

  return {
    focused,
    toDarken: sameRoom.filter((c) => c.status === "online" && !c.displayOff),
    offline: sameRoom.filter((c) => c.status === "offline"),
    alreadyOff: sameRoom.filter((c) => c.status === "online" && c.displayOff),
  };
}