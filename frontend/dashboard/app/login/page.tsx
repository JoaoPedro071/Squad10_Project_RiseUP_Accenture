import { GreaterThan } from "@/components/BrandMark";
import LoginForm from "@/components/LoginForm";
import { ui } from "@/lib/ui";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

// Só aceita voltar para uma página deste site (evita redirecionar para fora).
function safeNext(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  return (
    <section className={`${ui.card} mx-auto mt-10 w-full max-w-sm p-8`}>
      <GreaterThan className="h-10 w-10" />
      <h1 className="mt-4 text-3xl font-bold">Entrar</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        Use o e-mail e a senha cadastrados pela coordenação.
      </p>
      <LoginForm next={safeNext(next)} />
    </section>
  );
}