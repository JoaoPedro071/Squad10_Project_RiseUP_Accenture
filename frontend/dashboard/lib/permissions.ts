import type { User } from "@/types/api";

/** Coordenação: catálogo (experiências e imagens), stand-by e posições na planta.
 * O backend confere de novo (403); aqui só escondemos o que não dá para usar. */
export function canManage(user: User | null): boolean {
  return user?.role === "coordination";
}