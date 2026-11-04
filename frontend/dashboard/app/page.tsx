import FloorPlan from "@/components/FloorPlan";
import { getFocus, listClients, listExperiences } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Planta</h1>
      <FloorPlan
        initialClients={listClients()}
        initialFocus={getFocus()}
        experiences={listExperiences()}
      />
    </section>
  );
}