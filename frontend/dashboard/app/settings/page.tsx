import StandbyForm from "@/components/StandbyForm";
import { fetchImages, fetchSettings } from "@/services/api";
import NoPermission from "@/components/NoPermission";
import PageHeader from "@/components/PageHeader";
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
      <PageHeader title="Configurações" subtitle="Ajustes gerais das telas." />
      <StandbyForm
        images={images.filter((i) => i.active)}
        initialStandbyId={settings.standbyImageId}
      />
    </section>
  );
}