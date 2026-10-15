import Link from "next/link";
import ExperienceCard from "@/components/ExperienceCard";
import { listExperiences } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function ExperiencesPage() {
  const experiences = listExperiences();

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Experiências</h1>
        <Link
          href="/experiences/new"
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Nova experiência
        </Link>
      </div>
      {experiences.length === 0 ? (
        <p>Nenhuma experiência cadastrada.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </div>
      )}
    </section>
  );
}