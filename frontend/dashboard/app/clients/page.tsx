import ClientsBoard from "@/components/ClientsBoard";
import PageHeader from "@/components/PageHeader";
import { fetchExperiences, fetchImages, fetchState } from "@/services/api";
import { withSession } from "@/services/session";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [state, experiences, images] = await withSession((cookie) =>
    Promise.all([fetchState(cookie), fetchExperiences(cookie), fetchImages(cookie)]),
  );

  return (
    <section>
      <PageHeader
        title="Telas"
        subtitle="Acompanhe o estado de cada tela e escolha o que ela exibe."
      />
      {state.clients.length === 0 ? (
        <p>Nenhuma tela cadastrada.</p>
      ) : (
        <ClientsBoard
          initialClients={state.clients}
          initialFocus={state.focus}
          experiences={experiences}
          images={images}
        />
      )}
    </section>
  );
}