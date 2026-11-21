import type { Metadata } from "next";
import { AccountPageShell } from "@/components/account/AccountPageShell";
import { OrderDetailView } from "@/components/account/OrderDetailView";

export const metadata: Metadata = {
  title: "Order details",
  description: "Review the full details and progress of a Kamora Tech order.",
  robots: { index: false, follow: false },
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <AccountPageShell
      number="02"
      label="Order details"
      pageName="Order details"
      title="Your order."
      description="Review submitted requirements, status updates and account-visible order information."
    >
      <OrderDetailView id={params.id} />
    </AccountPageShell>
  );
}
