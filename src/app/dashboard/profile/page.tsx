import { PageHeader } from "@/components/layout/page-header";
import { getUser } from "@/lib/database/queries";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
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
