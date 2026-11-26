import Link from "next/link";
import type { User } from "@/types/api";
import LogoutButton from "./LogoutButton";

const links = [
  { href: "/", label: "Planta" },
  { href: "/experiences", label: "Experiências" },
  { href: "/images", label: "Imagens" },
  { href: "/clients", label: "Telas" },
  { href: "/settings", label: "Configurações" },
];

const roleLabel = { coordination: "Coordenação", support: "Apoio" };

// Sem usuário (página de login), mostra só o nome do sistema.
export default function Navbar({ user }: { user: User | null }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-6 py-3">
      <span className="mr-4 font-bold text-accent">Experience Platform</span>
      {user &&
        links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-2 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent"
          >
            {link.label}
          </Link>
        ))}
      {user && (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-foreground/70">
            {user.name} · {roleLabel[user.role]}
          </span>
          <LogoutButton />
        </div>
      )}
    </nav>
  );
}