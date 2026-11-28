import { Plus } from "lucide-react";
import Link from "next/link";
import ImageCard from "@/components/ImageCard";
import { fetchImages, fetchSettings } from "@/services/api";
import { canManage } from "@/lib/permissions";
import { ui } from "@/lib/ui";
import { currentUser, withSession } from "@/services/session";

export const dynamic = "force-dynamic";

export default async function ImagesPage() {
  const [images, settings] = await withSession((cookie) =>
    Promise.all([fetchImages(cookie), fetchSettings(cookie)]),
  );
  const manage = canManage(await currentUser());

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Imagens</h1>
        {manage && (
          <Link href="/images/new" className={ui.buttonPrimary}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Nova imagem
          </Link>
        )}
      </div>
      {images.length === 0 ? (
        <p className="text-muted">Nenhuma imagem cadastrada.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              isStandby={image.id === settings.standbyImageId}
              canManage={manage}
            />
          ))}
        </div>
      )}
    </section>
  );
}