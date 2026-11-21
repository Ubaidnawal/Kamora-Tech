import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { MessagesPanel } from "@/components/admin/MessagesPanel";

export const metadata: Metadata = {
  title: "Admin Messages",
  robots: { index: false, follow: false },
};

export default function AdminMessagesPage() {
  return (
    <AdminShell
      title="Messages"
      description="Read customer messages and reply through the admin messages endpoint."
    >
      <MessagesPanel />
    </AdminShell>
  );
}
