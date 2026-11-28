import ExperienceForm from "@/components/ExperienceForm";
import BackLink from "@/components/BackLink";
import NoPermission from "@/components/NoPermission";
import PageHeader from "@/components/PageHeader";
import { canManage } from "@/lib/permissions";
import { requireUser } from "@/services/session";

export const dynamic = "force-dynamic";

export default async function NewExperiencePage() {
  if (!canManage(await requireUser())) return <NoPermission />;
  return (
    <section>
      <BackLink href="/experiences" label="Experiências" />
      <PageHeader title="Nova experiência" />
      <ExperienceForm />
    </section>
  );
}