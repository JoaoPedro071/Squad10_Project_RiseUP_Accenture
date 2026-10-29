import ClientsBoard from "@/components/ClientsBoard";
import { getFocus, listClients, listExperiences } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function ClientsPage() {
  const clients = listClients();
  const experiences = listExperiences();
  const focus = getFocus();

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Telas</h1>
      {clients.length === 0 ? (
        <p>Nenhuma tela conectada.</p>
      ) : (
        <ClientsBoard
          initialClients={clients}
          experiences={experiences}
          initialFocus={focus}
        />
      )}
    </section>
  );
}