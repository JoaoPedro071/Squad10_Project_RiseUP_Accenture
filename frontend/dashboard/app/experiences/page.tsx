import Link from "next/link";
import ExperienceCard from "@/components/ExperienceCard";
import { fetchExperiences, fetchState } from "@/services/api";
import { canManage } from "@/lib/permissions";
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
    `inline-flex min-h-11 items-center rounded-md px-4 text-sm focus-visible:outline-2 focus-visible:outline-accent ${
      selected ? "bg-accent/30 font-medium" : "hover:bg-accent/20"
    }`;

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Experiências</h1>
        {manage && (
          <Link
            href="/experiences/new"
            className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Nova experiência
          </Link>
        )}
      </div>
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
        <p>
          {showInactive
            ? "Nenhuma experiência inativa."
            : "Nenhuma experiência ativa."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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