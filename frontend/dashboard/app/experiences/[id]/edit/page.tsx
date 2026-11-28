import { notFound } from "next/navigation";
import ExperienceForm from "@/components/ExperienceForm";
import { fetchExperiences, fetchState } from "@/services/api";

export const dynamic = "force-dynamic";

type EditExperiencePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditExperiencePage({ params }: EditExperiencePageProps) {
  const { id } = await params;
  const [experiences, state] = await Promise.all([fetchExperiences(), fetchState()]);
  const experience = experiences.find((e) => e.id === id);
  if (!experience) notFound();

  const screensInUse = state.clients
    .filter((c) => c.currentExperienceId === id)
    .map((c) => c.name);

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Editar experiência</h1>
      <ExperienceForm experience={experience} screensInUse={screensInUse} />
    </section>
  );
}