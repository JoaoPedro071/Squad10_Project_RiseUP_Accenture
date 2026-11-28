// Estilos compartilhados do dashboard (marca Accenture, modo escuro).
// Use estes nomes nos componentes, em vez de repetir as classes.

const buttonBase =
  "interactive inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50";

export const ui = {
  /** Coluna da página: a mesma no cabeçalho e no conteúdo (alinha logo e títulos). */
  container: "mx-auto w-full max-w-7xl px-4 md:px-8",
  /** Grade de cards das listas (Telas, Experiências, Imagens). */
  cardGrid: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",

  /** Ação principal da tela (uma por área). */
  buttonPrimary: `${buttonBase} bg-accent text-white hover:bg-accent-hover`,
  /** Ações secundárias (Cancelar, Editar...). */
  buttonSecondary: `${buttonBase} border border-border bg-card text-foreground hover:border-accent-light/60 hover:bg-accent/10`,
  /** Ações discretas em barras e menus. */
  buttonGhost: `${buttonBase} text-muted hover:bg-accent/10 hover:text-foreground`,
  /** Ações que removem algo. */
  buttonDanger: `${buttonBase} border border-danger/50 text-danger hover:bg-danger/10`,

  card: "rounded-lg border border-border bg-card p-4",
  label: "mb-1 block text-sm font-bold",
  hint: "mt-1 text-xs text-muted",
  /** Etiqueta pequena ("Inativa", "Stand-by atual"...). */
  chip: "inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs",
  chipAccent:
    "inline-flex items-center rounded-full border border-accent-light/50 px-2 py-0.5 text-xs text-accent-light",
  /** Fundo e caixa dos modais (<dialog>). */
  dialog:
    "m-auto max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-border bg-surface p-6 text-foreground backdrop:bg-black/70",
};

/** Campo de texto, lista ou área de texto; com borda vermelha quando há erro. */
export function inputClass(hasError = false): string {
  return `min-h-11 w-full rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-muted ${
    hasError ? "border-danger" : "border-border hover:border-muted"
  }`;
}