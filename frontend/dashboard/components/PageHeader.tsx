import type { ReactNode } from "react";

// Título padrão das páginas: h1, subtítulo opcional e ações à direita
// (no celular, as ações descem para baixo do título).
type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode; // ex.: botão "Nova experiência"
};

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="w-full min-w-0 sm:w-auto">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
