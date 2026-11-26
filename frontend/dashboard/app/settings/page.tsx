import StandbyForm from "@/components/StandbyForm";
import { fetchImages, fetchSettings } from "@/services/api";
import { withSession } from "@/services/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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