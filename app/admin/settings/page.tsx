import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsPanel } from "@/components/admin/SettingsPanel";

export const metadata: Metadata = {
  title: "Admin Settings",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return (
    <AdminShell
      title="Settings"
      description="Administrator account, session details and environment-safe configuration information."
    >
      <SettingsPanel />
    </AdminShell>
  );
}
