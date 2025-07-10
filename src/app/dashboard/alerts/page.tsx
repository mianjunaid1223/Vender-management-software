import { PageHeader } from "@/components/page-header";
import { AlertsTable } from "@/components/dashboard/alerts-table";
import { fetchNotifications, fetchExpiringContracts, getUser } from "@/lib/data";

export default async function AlertsPage() {
  const user = await getUser();
  const [notifications, expiringContracts] = await Promise.all([
    fetchNotifications(user.id),
    fetchExpiringContracts()
  ]);
  
  return (
    <div>
      <PageHeader 
        title="Alerts & Notifications" 
        description="Monitor important alerts, contract renewals, and compliance issues."
      />
      <AlertsTable 
        notifications={notifications}
        expiringContracts={expiringContracts}
      />
    </div>
  );
}
