import type { Metadata } from "next";
import { AccountPageShell } from "@/components/account/AccountPageShell";
import { SignupForm } from "@/components/account/AuthForm";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Kamora Tech account with email verification to keep track of your projects and orders.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <AccountPageShell
      number="02"
      label="Create account"
      pageName="Sign up"
      title="Create your account."
      description="Register with Kamora Tech to keep your profile, service details, project communication and order history in one place."
    >
      <SignupForm />
    </AccountPageShell>
  );
}
