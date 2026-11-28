import ImageForm from "@/components/ImageForm";
import NoPermission from "@/components/NoPermission";
import { canManage } from "@/lib/permissions";
import { requireUser } from "@/services/session";

export const dynamic = "force-dynamic";

export default async function NewImagePage() {
  if (!canManage(await requireUser())) return <NoPermission />;
  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Nova imagem</h1>
      <ImageForm />
    </section>
  );
}