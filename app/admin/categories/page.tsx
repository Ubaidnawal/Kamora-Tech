import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";

export const metadata: Metadata = {
  title: "Admin Categories",
  robots: { index: false, follow: false },
};

export default function AdminCategoriesPage() {
  return (
    <AdminShell
      title="Categories"
      description="List and create product categories using the admin categories API."
    >
      <CategoriesPanel />
    </AdminShell>
  );
}
