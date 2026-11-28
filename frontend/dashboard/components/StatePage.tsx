import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Página de aviso centralizada (erro, sem permissão, não encontrada).
type StatePageProps = {
  icon: LucideIcon;
  title: string;
  children: ReactNode; // texto e botões
};

export default function StatePage({
  icon: Icon,
  title,
  children,
}: StatePageProps) {
  return (
    <section
      role="alert"
      className="mx-auto mt-10 flex max-w-lg flex-col items-center p-6 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent-light">
        <Icon aria-hidden="true" className="h-7 w-7" />
      </span>
      <h1 className="mt-4 text-2xl font-bold">{title}</h1>
      <div className="mt-2 flex flex-col items-center gap-4 text-sm text-muted">
        {children}
      </div>
    </section>
  );
}