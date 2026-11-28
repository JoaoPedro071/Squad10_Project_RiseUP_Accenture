import ImageForm from "@/components/ImageForm";
import BackLink from "@/components/BackLink";
import NoPermission from "@/components/NoPermission";
import PageHeader from "@/components/PageHeader";
import { canManage } from "@/lib/permissions";
import { requireUser } from "@/services/session";

export const dynamic = "force-dynamic";

export default async function NewImagePage() {
  if (!canManage(await requireUser())) return <NoPermission />;
  return (
    <section>
      <BackLink href="/images" label="Imagens" />
      <PageHeader title="Nova imagem" />
      <ImageForm />
    </section>
  );
}