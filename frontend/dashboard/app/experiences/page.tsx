import { Plus } from "lucide-react";
import Link from "next/link";
import ExperienceCard from "@/components/ExperienceCard";
import PageHeader from "@/components/PageHeader";
import { fetchExperiences, fetchState } from "@/services/api";
import { canManage } from "@/lib/permissions";
import { ui } from "@/lib/ui";
import { currentUser, withSession } from "@/services/session";

export const dynamic = "force-dynamic";

type ExperiencesPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function ExperiencesPage({
  searchParams,
}: ExperiencesPageProps) {
  const { status } = await searchParams;
  const showInactive = status === "inactive";
  const [experiences, state] = await withSession((cookie) =>
    Promise.all([fetchExperiences(cookie), fetchState(cookie)]),
  );
  const manage = canManage(await currentUser());

  const active = experiences.filter((e) => e.active);
  const inactive = experiences.filter((e) => !e.active);
  const shown = showInactive ? inactive : active;
  const inUseCount = (id: string) =>
    state.clients.filter((c) => c.currentExperienceId === id).length;

  const tabClass = (selected: boolean) =>
    `interactive inline-flex min-h-11 items-center rounded-md px-4 text-sm ${
      selected
        ? "bg-accent/15 font-bold text-accent-light"
        : "text-muted hover:bg-accent/10 hover:text-foreground"
    }`;

  return (
    <section>
      <PageHeader
        title="Experiências"
        subtitle="Páginas web que podem ser exibidas nas telas."
        actions={
          manage && (
            <Link href="/experiences/new" className={ui.buttonPrimary}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nova experiência
            </Link>
          )
        }
      />
      <nav aria-label="Filtrar experiências" className="mb-4 flex gap-2">
        <Link
          href="/experiences"
          aria-current={showInactive ? undefined : "page"}
          className={tabClass(!showInactive)}
        >
          Ativas ({active.length})
        </Link>
        <Link
          href="/experiences?status=inactive"
          aria-current={showInactive ? "page" : undefined}
          className={tabClass(showInactive)}
        >
          Inativas ({inactive.length})
        </Link>
      </nav>
      {shown.length === 0 ? (
        <p className="text-muted">
          {showInactive
            ? "Nenhuma experiência inativa."
            : "Nenhuma experiência ativa."}
        </p>
      ) : (
        <div className={ui.cardGrid}>
          {shown.map((experience) => (
            <ExperienceCard
              key={experience.id}
              experience={experience}
              inUseCount={inUseCount(experience.id)}
              canManage={manage}
            />
          ))}
        </div>
      )}
    </section>
  );
}