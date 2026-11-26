import Link from "next/link";
import ImageCard from "@/components/ImageCard";
import { fetchImages, fetchSettings } from "@/services/api";
import { withSession } from "@/services/session";

export const dynamic = "force-dynamic";

export default async function ImagesPage() {
  const [images, settings] = await withSession((cookie) =>
    Promise.all([fetchImages(cookie), fetchSettings(cookie)]),
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Imagens</h1>
        <Link
          href="/images/new"
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-white hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Nova imagem
        </Link>
      </div>
      {images.length === 0 ? (
        <p>Nenhuma imagem cadastrada.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              isStandby={image.id === settings.standbyImageId}
            />
          ))}
        </div>
      )}
    </section>
  );
}