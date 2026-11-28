"use client";

import {
  Clapperboard,
  Image as ImageIcon,
  Map as MapIcon,
  Menu,
  Monitor,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { canManage } from "@/lib/permissions";
import { ui } from "@/lib/ui";
import type { User } from "@/types/api";
import BrandMark from "./BrandMark";
import LogoutButton from "./LogoutButton";

const links = [
  { href: "/", label: "Planta", icon: MapIcon },
  { href: "/experiences", label: "Experiências", icon: Clapperboard },
  { href: "/images", label: "Imagens", icon: ImageIcon },
  { href: "/clients", label: "Telas", icon: Monitor },
  { href: "/settings", label: "Configurações", icon: Settings, coordinationOnly: true },
];

const roleLabel = { coordination: "Coordenação", support: "Apoio" };

// A página atual: "/" só quando é exatamente a planta.
function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

// Sem usuário (página de login), mostra só o logo.
export default function Navbar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // menu do celular

  // Fecha o menu do celular ao apertar Esc (e ao escolher um link, abaixo).
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const visible = user
    ? links.filter((link) => !link.coordinationOnly || canManage(user))
    : [];

  const navLinks = (layout: "bar" | "drawer") =>
    visible.map(({ href, label, icon: Icon }) => {
      const active = isActive(pathname, href);
      return (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          onClick={() => setOpen(false)}
          className={`interactive flex min-h-11 items-center gap-2 rounded-md px-3 text-sm ${
            active
              ? "bg-accent/15 font-bold text-accent-light"
              : "text-muted hover:bg-accent/10 hover:text-foreground"
          } ${layout === "drawer" ? "w-full" : ""}`}
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
          {label}
        </Link>
      );
    });

  return (
    // O fundo ocupa a largura toda; o conteúdo fica na coluna das páginas.
    <header className="border-b border-border bg-surface">
      <div className={`${ui.container} flex min-h-16 items-center gap-2`}>
        {user ? (
          <Link href="/" className="mr-4 rounded-md" aria-label="Experience Manager, ir para a planta">
            <BrandMark />
          </Link>
        ) : (
          // Na tela de login, o logo não é link (evita o Next pré-carregar a
          // planta sem sessão e reaproveitar o redirecionamento depois de entrar).
          <span className="mr-4">
            <BrandMark />
          </span>
        )}

        {user && (
          <>
            <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
              {navLinks("bar")}
            </nav>
            <div className="ml-auto hidden items-center gap-3 md:flex">
              <span className="text-sm text-muted">
                {user.name} · {roleLabel[user.role]}
              </span>
              <LogoutButton />
            </div>
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              className="interactive ml-auto flex h-11 w-11 items-center justify-center rounded-md text-foreground hover:bg-accent/10 md:hidden"
            >
              {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </>
        )}
      </div>

      {user && open && (
        <div id="mobile-menu" className="border-t border-border md:hidden">
          <div className={`${ui.container} pb-4`}>
            <nav aria-label="Principal" className="flex flex-col gap-1 pt-2">
              {navLinks("drawer")}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted">
                {user.name} · {roleLabel[user.role]}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}