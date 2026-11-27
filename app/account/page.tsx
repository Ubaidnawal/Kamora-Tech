import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { DashboardView } from "@/components/account/DashboardView";

export const metadata: Metadata = {
  title: "My Account",
  description: "Your Kamora Tech account overview, orders and project progress.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-background pt-36 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <div className="site-container relative pb-14 lg:pb-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.18em] text-paper-faint">
            <Link href="/" className="transition-colors hover:text-brass">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-brass">My Account</span>
          </nav>
          <div className="mt-12 max-w-3xl">
            <div className="mb-8 flex items-center gap-4">
              <span className="font-condense text-sm tracking-[0.2em] text-brass">01</span>
              <span className="h-px w-10 bg-brass/70" />
              <span className="eyebrow">Account overview</span>
            </div>
            <h1 className="display-xl text-[clamp(2.8rem,7vw,6rem)] text-paper-pure">Your workspace.</h1>
            <p className="body-copy mt-7">
              Review real order data, track active projects and keep your account details in one secure place.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 lg:py-28">
        <div className="site-container">
          <DashboardView />
        </div>
      </section>
    </>
  );
}
