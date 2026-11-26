import { notFound } from "next/navigation";
import ExperienceForm from "@/components/ExperienceForm";
import { fetchExperiences, fetchState } from "@/services/api";
import BackLink from "@/components/BackLink";
import NoPermission from "@/components/NoPermission";
import { canManage } from "@/lib/permissions";
import { requireUser, withSession } from "@/services/session";

export const dynamic = "force-dynamic";

type EditExperiencePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditExperiencePage({
  params,
}: EditExperiencePageProps) {
  if (!canManage(await requireUser())) return <NoPermission />;
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
      <BackLink href="/experiences" label="Experiências" />
      <h1 className="mb-6 text-3xl font-bold">Editar experiência</h1>
      <ExperienceForm experience={experience} screensInUse={screensInUse} />
    </section>
  );
}