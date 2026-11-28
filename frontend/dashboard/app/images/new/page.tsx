import ImageForm from "@/components/ImageForm";
import BackLink from "@/components/BackLink";
import NoPermission from "@/components/NoPermission";
import { canManage } from "@/lib/permissions";
import { requireUser } from "@/services/session";

export const dynamic = "force-dynamic";

export default async function NewImagePage() {
  if (!canManage(await requireUser())) return <NoPermission />;
  return (
    <section>
      <BackLink href="/images" label="Imagens" />
      <h1 className="mb-6 text-3xl font-bold">Nova imagem</h1>
      <ImageForm />
    </section>
  );
}