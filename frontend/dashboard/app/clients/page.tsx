import ClientsBoard from "@/components/ClientsBoard";
import NewClientButton from "@/components/NewClientButton";
import PageHeader from "@/components/PageHeader";
import { canManage } from "@/lib/permissions";
import { fetchExperiences, fetchImages, fetchState } from "@/services/api";
import { currentUser, withSession } from "@/services/session";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [state, experiences, images] = await withSession((cookie) =>
    Promise.all([fetchState(cookie), fetchExperiences(cookie), fetchImages(cookie)]),
  );
  const manage = canManage(await currentUser());

  return (
    <section>
      <PageHeader
        title="Telas"
        subtitle="Acompanhe o estado de cada tela e escolha o que ela exibe."
        actions={manage && <NewClientButton />}
      />
      {/* Sempre montado (mesmo sem telas): a primeira tela criada chega pelo WebSocket. */}
      <ClientsBoard
        initialClients={state.clients}
        initialFocus={state.focus}
        experiences={experiences}
        images={images}
        canManage={manage}
      />
    </section>
  );
}
