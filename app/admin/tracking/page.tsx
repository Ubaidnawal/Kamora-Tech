import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { TrackingPanel } from "@/components/admin/TrackingPanel";

export const metadata: Metadata = {
  title: "Admin Tracking",
  robots: { index: false, follow: false },
};

export default function AdminTrackingPage() {
  return (
    <AdminShell
      title="Tracking"
      description="Order tracking IDs and status timelines derived from the admin orders API."
    >
      <TrackingPanel />
    </AdminShell>
  );
}
