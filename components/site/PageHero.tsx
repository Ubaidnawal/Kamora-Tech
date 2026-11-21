import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { CoreVisual } from "@/three/CoreVisual";
import { Reveal } from "./Reveal";
import { TextReveal, type RevealLine } from "./TextReveal";

type PageHeroProps = {
  number: string;
  label: string;
  pageName: string;
  lines: RevealLine[];
  description: string;
  meta?: { value: string; label: string }[];
  children?: ReactNode;
};

export function PageHero({
  number,
  label,
  pageName,
  lines,
  description,
  meta,
  children,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-background pt-32 lg:pt-44">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-brass/[0.05] blur-[130px]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.03]" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-4%] top-[6%] hidden h-[460px] w-[460px] opacity-50 lg:block">
        <CoreVisual variant="accent" className="h-full w-full" />
      </div>

      <div className="site-container relative">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.18em] text-paper-faint">
          <Link href="/" className="transition-colors hover:text-brass">Home</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-brass">{pageName}</span>
        </nav>

        <div className="mt-12 grid gap-10 pb-16 lg:mt-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:gap-16 lg:pb-24">
          <div className="relative z-10">
            <div className="mb-8 flex items-center gap-4">
              <span className="font-condense text-sm tracking-[0.2em] text-brass">{number}</span>
              <span className="h-px w-10 bg-brass/70" />
              <span className="eyebrow">{label}</span>
            </div>
            <TextReveal
              lines={lines}
              className="display-xl text-[clamp(2.8rem,7.2vw,7rem)] text-paper-pure"
              delay={0.05}
            />
          </div>

          <Reveal delay={0.25} className="relative z-10 border-l border-brass/40 pl-6 lg:pl-8">
            <p className="body-copy text-base">{description}</p>
            {children && <div className="mt-8">{children}</div>}
          </Reveal>
        </div>

        {meta && (
          <div className="grid grid-cols-2 border-t border-white/10 lg:grid-cols-4">
            {meta.map((item) => (
              <div key={item.label} className="border-b border-white/10 px-4 py-6 first:pl-0 lg:border-b-0 lg:border-r lg:px-8 lg:last:border-r-0">
                <p className="font-condense text-2xl tracking-wide text-paper-pure sm:text-3xl">{item.value}</p>
                <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.16em] text-brass">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
