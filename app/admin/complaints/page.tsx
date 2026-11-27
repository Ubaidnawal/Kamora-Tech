import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ComplaintsPanel } from "@/components/admin/ComplaintsPanel";

export const metadata: Metadata = {
  title: "Admin Complaints",
  robots: { index: false, follow: false },
};

export default function AdminComplaintsPage() {
  return (
    <AdminShell title="Complaints" description="Review complaint cases, update public status and keep private internal notes.">
      <ComplaintsPanel />
    </AdminShell>
  );
}
