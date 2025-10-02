import { PageHeader } from "@/shared/components/page-header";
import { getUser } from "@/shared/lib/data";
import { ProfileForm } from "@/features/dashboard/components/profile-form";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getUser();
  
  if (!user) {
    redirect('/login');
  }

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
