"use client"; // Telas de erro precisam rodar no navegador.

import { API_URL } from "@/lib/config";

export default function Error({ retry }: { error: Error; retry: () => void }) {
  return (
    <section role="alert" className="mx-auto max-w-lg p-6 text-center">
      <h1 className="text-xl font-bold">Não foi possível carregar os dados</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Verifique se o backend está rodando em {API_URL} e tente novamente.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Tentar novamente
      </button>
    </section>
  );
}