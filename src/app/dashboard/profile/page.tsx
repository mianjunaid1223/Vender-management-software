import { PageHeader } from "@/components/page-header";
import { getUser } from "@/lib/data";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function ProfilePage() {
  const user = await getUser();

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Manage your account settings and personal information."
      />
      <ProfileForm user={user} />
    </div>
  );
}
