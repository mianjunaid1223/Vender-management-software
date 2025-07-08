import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { VendorsTable } from "@/components/dashboard/vendors-table";
import { MOCK_VENDORS } from "@/lib/mock-data";
import { PlusCircle } from "lucide-react";
import clientPromise from "@/lib/mongodb";
import type { Vendor } from "@/lib/types";

async function getVendors(): Promise<Vendor[]> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const vendorsCollection = db.collection("vendors");

    const count = await vendorsCollection.countDocuments();
    if (count === 0) {
      console.log("Seeding vendors...");
      const vendorsToSeed = MOCK_VENDORS.map(({ id, ...rest }) => rest);
      await vendorsCollection.insertMany(vendorsToSeed);
    }

    const vendors = await vendorsCollection.find({}).toArray();

    return vendors.map((vendor) => ({
      ...vendor,
      id: vendor._id.toString(),
    })) as unknown as Vendor[];
  } catch (error) {
    console.error("Database Error:", error);
    return [];
  }
}

export default async function VendorsPage() {
  const vendors = await getVendors();
  return (
    <div>
      <PageHeader 
        title="Vendors" 
        description="Manage your company's vendors and their contact information."
      >
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </PageHeader>
      <VendorsTable data={vendors} />
    </div>
  );
}
