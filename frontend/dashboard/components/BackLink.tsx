import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// "Voltar" discreto no topo das páginas de formulário.
export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="interactive mb-2 inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm text-muted hover:text-foreground"
    >
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      {label}
    </Link>
  );
}