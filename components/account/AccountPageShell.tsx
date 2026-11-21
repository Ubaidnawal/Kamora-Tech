import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type AccountPageShellProps = {
  number: string;
  label: string;
  pageName: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AccountPageShell({ number, label, pageName, title, description, children }: AccountPageShellProps) {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-background pt-36 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <div className="site-container relative pb-14 lg:pb-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.18em] text-paper-faint">
            <Link href="/" className="transition-colors hover:text-brass">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-brass">{pageName}</span>
          </nav>
          <div className="mt-12 max-w-3xl">
            <div className="mb-8 flex items-center gap-4">
              <span className="font-condense text-sm tracking-[0.2em] text-brass">{number}</span>
              <span className="h-px w-10 bg-brass/70" />
              <span className="eyebrow">{label}</span>
            </div>
            <h1 className="display-xl text-[clamp(2.8rem,7.2vw,6.5rem)] text-paper-pure">{title}</h1>
            <p className="body-copy mt-7">{description}</p>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 lg:py-28">
        <div className="site-container grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <aside className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow">Account / Secure area</p>
            <p className="mt-5 max-w-xs font-sans text-xs leading-relaxed text-paper-faint">
              Your information is sent only to the configured authentication service. This site does not store passwords or generate example records.
            </p>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </section>
    </>
  );
}
