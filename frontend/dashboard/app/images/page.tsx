import { Plus } from "lucide-react";
import Link from "next/link";
import ImageCard from "@/components/ImageCard";
import PageHeader from "@/components/PageHeader";
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
      <PageHeader
        title="Imagens"
        subtitle="Imagens para exibir nas telas ou usar como stand-by."
        actions={
          manage && (
            <Link href="/images/new" className={ui.buttonPrimary}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Nova imagem
            </Link>
          )
        }
      />
      {images.length === 0 ? (
        <p className="text-muted">Nenhuma imagem cadastrada.</p>
      ) : (
        <div className={ui.cardGrid}>
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