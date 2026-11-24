import StandbyForm from "@/components/StandbyForm";
import { fetchImages, fetchSettings } from "@/services/api";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [images, settings] = await Promise.all([fetchImages(), fetchSettings()]);

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