import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { CustomersPanel } from "@/components/admin/CustomersPanel";

export const metadata: Metadata = {
  title: "Admin Customers",
  robots: { index: false, follow: false },
};

export default function AdminCustomersPage() {
  return (
    <AdminShell title="Customers" description="Find customer accounts and open a complete profile with linked records.">
      <CustomersPanel />
    </AdminShell>
  );
}
