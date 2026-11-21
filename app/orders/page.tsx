import type { Metadata } from "next";
import { AccountPageShell } from "@/components/account/AccountPageShell";
import { OrdersPanel } from "@/components/account/OrdersPanel";

export const metadata: Metadata = {
  title: "Orders",
  description: "View orders linked to your Kamora Tech account.",
  robots: { index: false, follow: false },
};

export default function OrdersPage() {
  return (
    <AccountPageShell
      number="03"
      label="Order history"
      pageName="Orders"
      title="Your orders."
      description="Review your submitted order requests, their current status and payment information in one secure place."
    >
      <OrdersPanel />
    </AccountPageShell>
  );
}
