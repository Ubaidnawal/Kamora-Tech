import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReportsPanel } from "@/components/admin/ReportsPanel";

export const metadata: Metadata = {
  title: "Admin Reports",
  robots: { index: false, follow: false },
};

export default function AdminReportsPage() {
  return (
    <AdminShell
      title="Reports"
      description="Database-backed statistics and paid-only revenue from the admin dashboard and reports APIs."
    >
      <ReportsPanel />
    </AdminShell>
  );
}
