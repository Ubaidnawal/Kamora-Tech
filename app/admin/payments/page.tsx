import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { PaymentsPanel } from "@/components/admin/PaymentsPanel";

export const metadata: Metadata = {
  title: "Admin Payments",
  robots: { index: false, follow: false },
};

export default function AdminPaymentsPage() {
  return (
    <AdminShell
      title="Payments"
      description="Recorded payment data derived from admin orders and database reports."
    >
      <PaymentsPanel />
    </AdminShell>
  );
}
