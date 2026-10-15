import Link from "next/link";

const links = [
  { href: "/", label: "Painel" },
  { href: "/experiences", label: "Experiências" },
  { href: "/clients", label: "Telas" },
];

export default function Navbar() {
  return (
    <nav className="flex items-center gap-2 border-b border-border bg-surface px-6 py-3">
      <span className="mr-4 font-bold text-accent">Experience Platform</span>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-md px-3 py-2 text-sm hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-accent"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}