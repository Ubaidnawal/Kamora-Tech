import type { Metadata } from "next";
import { AccountPageShell } from "@/components/account/AccountPageShell";
import { CheckoutView } from "@/components/account/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Submit a Kamora Tech order request tied to your account.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <AccountPageShell
      number="04"
      label="Checkout"
      pageName="Checkout"
      title="Request your project."
      description="Confirm your contact details and project requirements. This creates a quoted order request, not a payment."
    >
      <CheckoutView />
    </AccountPageShell>
  );
}
