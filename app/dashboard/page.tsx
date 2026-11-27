"use client";

import { useEffect, useState } from "react";
import AdminDashboardPage from "@/app/admin/page";
import { AdminShell } from "@/components/admin/AdminShell";
import { SettingsPanel } from "@/components/admin/SettingsPanel";

export default function DashboardPage() {
  const [section, setSection] = useState<"overview" | "settings">("overview");

  useEffect(() => {
    const sync = () => {
      const hash = window.location.hash.replace(/^#/, "").toLowerCase();
      setSection(hash === "settings" ? "settings" : "overview");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  if (section === "settings") {
    return (
      <AdminShell title="Settings" description="Manage site settings and administrator session information.">
        <SettingsPanel />
      </AdminShell>
    );
  }

  return <AdminDashboardPage />;
}
