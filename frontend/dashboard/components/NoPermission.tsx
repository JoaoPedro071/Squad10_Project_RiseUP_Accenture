import Link from "next/link";

// Mostrada quando o perfil Apoio abre uma página só da Coordenação.
export default function NoPermission() {
  return (
    <section role="alert" className="mx-auto max-w-lg p-6 text-center">
      <h1 className="text-xl font-bold">Sem permissão</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Esta página é da Coordenação. Com o perfil Apoio, você pode trocar o conteúdo das
        telas, usar o Modo foco e identificar as telas.
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Voltar para a planta
      </Link>
    </section>
  );
}