import type { Client } from "@/types/client";

// Status que aparece na tela, sempre com ícone e rótulo (ver StatusBadge).
export function clientStatus(client: Client): "online" | "offline" | "standby" {
  if (client.status === "offline") return "offline";
  return client.displayOff ? "standby" : "online";
}