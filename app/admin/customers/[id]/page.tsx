import type { Metadata } from "next";
import { CustomerDetailPage } from "@/components/admin/CustomersPanel";

export const metadata: Metadata = {
  title: "Admin Customer Profile",
  robots: { index: false, follow: false },
};

export default function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  return <CustomerDetailPage userId={params.id} />;
}
