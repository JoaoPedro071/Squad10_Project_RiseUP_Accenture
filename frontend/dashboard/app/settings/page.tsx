import StandbyForm from "@/components/StandbyForm";
import { fetchImages, fetchSettings } from "@/services/api";
import NoPermission from "@/components/NoPermission";
import { canManage } from "@/lib/permissions";
import { requireUser, withSession } from "@/services/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!canManage(await requireUser())) return <NoPermission />;
  const [images, settings] = await withSession((cookie) =>
    Promise.all([fetchImages(cookie), fetchSettings(cookie)]),
  );

  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">Configurações</h1>
      <StandbyForm
        images={images.filter((i) => i.active)}
        initialStandbyId={settings.standbyImageId}
      />
    </section>
  );
}