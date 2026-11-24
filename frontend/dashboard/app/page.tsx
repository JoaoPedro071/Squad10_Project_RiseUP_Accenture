import FloorPlan from "@/components/FloorPlan";
import { fetchExperiences, fetchImages, fetchState } from "@/services/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [state, experiences, images] = await Promise.all([
    fetchState(),
    fetchExperiences(),
    fetchImages(),
  ]);

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <h1 className="sr-only">Planta do escritório</h1>
      <FloorPlan
        initialClients={state.clients}
        initialFocus={state.focus}
        experiences={experiences}
        images={images}
      />
    </section>
  );
}