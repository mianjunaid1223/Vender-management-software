import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { getUser } from "@/lib/data";

export default async function SettingsPage() {
  const user = await getUser();

  return (
    <div>
      <PageHeader 
        title="Settings" 
        description="Configure your business context and preferences to improve AI assistance."
      />
      <SettingsForm user={user} />
    </div>
  );
}
