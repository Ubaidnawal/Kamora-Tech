import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { UsersPanel } from "@/components/admin/UsersPanel";

export const metadata: Metadata = {
  title: "Admin Users",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <AdminShell
      title="Users"
      description="Review accounts returned by the admin users API and update account status."
    >
      <UsersPanel />
    </AdminShell>
  );
}
