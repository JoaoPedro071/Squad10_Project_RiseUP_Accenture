import LoginForm from "@/components/LoginForm";

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
    <section className="mx-auto mt-10 w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-bold">Entrar</h1>
      <p className="mb-6 text-sm text-foreground/70">
        Use o e-mail e a senha cadastrados pela coordenação.
      </p>
      <LoginForm next={safeNext(next)} />
    </section>
  );
}