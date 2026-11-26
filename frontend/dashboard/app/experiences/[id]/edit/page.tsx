import { notFound } from "next/navigation";
import ExperienceForm from "@/components/ExperienceForm";
import { fetchExperiences, fetchState } from "@/services/api";
import { withSession } from "@/services/session";

export const dynamic = "force-dynamic";

type EditExperiencePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditExperiencePage({ params }: EditExperiencePageProps) {
  const { id } = await params;
  const [experiences, state] = await withSession((cookie) =>
    Promise.all([fetchExperiences(cookie), fetchState(cookie)]),
  );
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