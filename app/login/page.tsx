import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPageShell } from "@/components/account/AccountPageShell";
import { LoginForm } from "@/components/account/AuthForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your Kamora Tech account to manage your profile, projects and orders.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AccountPageShell
      number="01"
      label="Account access"
      pageName="Log in"
      title="Welcome back."
      description="Access your Kamora Tech account with the email address and password linked to your profile, projects and orders."
    >
      <Suspense fallback={<div className="border border-white/10 bg-surface p-6 sm:p-10"><p className="font-sans text-xs text-paper-faint">Loading sign-in form...</p></div>}>
        <LoginForm />
      </Suspense>
    </AccountPageShell>
  );
}
