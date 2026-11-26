"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { LogIn } from "lucide-react";
import { inputClass, ui } from "@/lib/ui";
import { ApiError, login } from "@/services/api";
import Notice from "./Notice";

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Informe e-mail e senha.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await login(email, password);
      router.replace(next);
      router.refresh(); // recarrega o menu com o nome do usuário
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível entrar. Verifique a conexão e tente novamente.",
      );
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <label htmlFor="login-email" className={ui.label}>
          E-mail
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass(!!error)}
        />
      </div>
      <div>
        <label htmlFor="login-password" className={ui.label}>
          Senha
        </label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass(!!error)}
        />
      </div>
      {error && <Notice variant="error">{error}</Notice>}
      <button type="submit" disabled={saving} className={ui.buttonPrimary}>
        <LogIn aria-hidden="true" className="h-4 w-4" />
        {saving ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}