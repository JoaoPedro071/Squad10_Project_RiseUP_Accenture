import { notFound } from "next/navigation";
import ImageForm from "@/components/ImageForm";
import { fetchImages } from "@/services/api";
import NoPermission from "@/components/NoPermission";
import { canManage } from "@/lib/permissions";
import { requireUser, withSession } from "@/services/session";

export const dynamic = "force-dynamic";

type EditImagePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditImagePage({ params }: EditImagePageProps) {
  if (!canManage(await requireUser())) return <NoPermission />;
  const { id } = await params;
  const images = await withSession((cookie) => fetchImages(cookie));
  const image = images.find((i) => i.id === id);
  if (!image) notFound();

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Editar imagem</h1>
      <ImageForm image={image} />
    </section>
  );
}