// Sessão nas páginas do servidor: repassa o cookie do navegador ao backend.
// Só pode ser usado em páginas e layouts do servidor (lê next/headers).
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/config";
import { ApiError, fetchMe } from "@/services/api";
import type { User } from "@/types/api";

async function sessionCookie(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? `${SESSION_COOKIE}=${token}` : null;
}

/** Carrega os dados de uma página com a sessão. Sem sessão válida, vai para o login. */
export async function withSession<T>(load: (cookie: string) => Promise<T>): Promise<T> {
  const cookie = await sessionCookie();
  if (!cookie) redirect("/login");
  let result: T;
  try {
    result = await load(cookie);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login");
    throw error;
  }
  return result;
}

/** Quem está logado (para o menu). null = ninguém ou backend fora do ar. */
export async function currentUser(): Promise<User | null> {
  const cookie = await sessionCookie();
  if (!cookie) return null;
  try {
    return await fetchMe(cookie);
  } catch {
    return null;
  }
}