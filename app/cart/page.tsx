import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your selected Kamora Tech solutions and send a single project enquiry.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-background pt-36 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <div className="site-container relative pb-14 lg:pb-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.18em] text-paper-faint">
            <Link href="/" className="transition-colors hover:text-brass">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-brass">Cart</span>
          </nav>
          <div className="mt-12 max-w-3xl">
            <div className="mb-8 flex items-center gap-4">
              <span className="font-condense text-sm tracking-[0.2em] text-brass">04</span>
              <span className="h-px w-10 bg-brass/70" />
              <span className="eyebrow">Enquiry list</span>
            </div>
            <h1 className="display-xl text-[clamp(2.8rem,7vw,6rem)] text-paper-pure">Your selection.</h1>
            <p className="body-copy mt-7">
              Build a shortlist of solutions, adjust quantities and continue to checkout. Orders are quoted after discovery and no payment is recorded online.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 lg:py-28">
        <div className="site-container">
          <CartView />
        </div>
      </section>
    </>
  );
}
