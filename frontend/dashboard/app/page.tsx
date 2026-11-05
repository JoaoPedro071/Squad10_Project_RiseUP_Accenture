import FloorPlan from "@/components/FloorPlan";
import { getFocus, listClients, listExperiences } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <h1 className="sr-only">Planta do escritório</h1>
      <FloorPlan
        initialClients={listClients()}
        initialFocus={getFocus()}
        experiences={listExperiences()}
      />
    </section>
  );
}