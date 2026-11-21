import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { TrackView } from "@/components/account/TrackView";

export const metadata: Metadata = {
  title: "Track order",
  description: "Check the public status and timeline of a Kamora Tech order.",
  robots: { index: false, follow: false },
};

export default function TrackPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-background pt-36 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <div className="site-container relative pb-14 lg:pb-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.18em] text-paper-faint">
            <Link href="/" className="transition-colors hover:text-brass">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-brass">Track order</span>
          </nav>
          <div className="mt-12 max-w-3xl">
            <div className="mb-8 flex items-center gap-4">
              <span className="font-condense text-sm tracking-[0.2em] text-brass">05</span>
              <span className="h-px w-10 bg-brass/70" />
              <span className="eyebrow">Order tracking</span>
            </div>
            <h1 className="display-xl text-[clamp(2.8rem,7vw,6rem)] text-paper-pure">Track progress.</h1>
            <p className="body-copy mt-7">
              Use your order ID, tracking ID, or internal order ID to see the latest public status and milestone history for your project.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 lg:py-28">
        <div className="site-container">
          <TrackView />
        </div>
      </section>
    </>
  );
}
