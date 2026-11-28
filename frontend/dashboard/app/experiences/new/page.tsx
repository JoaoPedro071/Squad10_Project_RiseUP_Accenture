import ExperienceForm from "@/components/ExperienceForm";
import BackLink from "@/components/BackLink";
import NoPermission from "@/components/NoPermission";
import { canManage } from "@/lib/permissions";
import { requireUser } from "@/services/session";

export const dynamic = "force-dynamic";

export default async function NewExperiencePage() {
  if (!canManage(await requireUser())) return <NoPermission />;
  return (
    <section>
      <BackLink href="/experiences" label="Experiências" />
      <h1 className="mb-6 text-3xl font-bold">Nova experiência</h1>
      <ExperienceForm />
    </section>
  );
}