import type { Experience } from "@/types/experience";

type ExperienceCardProps = {
  experience: Experience;
};

const orientationLabel = {
  landscape: "Paisagem",
  portrait: "Retrato",
  any: "Qualquer orientação",
};

export default function ExperienceCard({ experience }: ExperienceCardProps) {
  return (
    <article
      className={`rounded-lg border border-border bg-surface p-4 ${
        experience.active ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{experience.title}</h2>
        {!experience.active && (
          <span className="rounded-full border border-border px-2 py-1 text-xs">
            Inativa
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-foreground/80">{experience.description}</p>
      <p className="mt-3 text-xs text-foreground/60">
        {experience.type === "web" ? "Página web" : "Imagem"} ·{" "}
        {orientationLabel[experience.orientation]}
      </p>
    </article>
  );
}