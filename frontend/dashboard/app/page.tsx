import { listClients, listExperiences } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function Home() {
  const clients = listClients();
  const experiences = listExperiences();

  const online = clients.filter((c) => c.status === "online").length;
  const active = experiences.filter((e) => e.active).length;

  const cards = [
    { label: "Telas online", value: `${online} de ${clients.length}` },
    { label: "Experiências ativas", value: String(active) },
  ];

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Painel</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <p className="text-sm text-foreground/70">{card.label}</p>
            <p className="mt-1 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}