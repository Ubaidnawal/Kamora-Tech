import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./Reveal";

type CTASectionProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  light?: boolean;
};

export function CTASection({
  eyebrow = "Start a conversation",
  title = "HAVE SOMETHING IN MIND?",
  description = "Tell us what you are building. We will bring the clarity, craft and technical depth to make it real.",
  light = false,
}: CTASectionProps) {
  return (
    <section
      className={`relative overflow-hidden border-y ${
        light ? "border-ink/10 bg-paper text-ink" : "border-white/10 bg-surface"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-60" aria-hidden="true" />
      <div
        className={`pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full blur-[120px] ${
          light ? "bg-brass/25" : "bg-brass/[0.07]"
        }`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute inset-y-0 left-1/3 w-px ${light ? "bg-ink/10" : "bg-white/5"}`}
        aria-hidden="true"
      />
      <div
        className={`pointer-events-none absolute inset-y-0 left-2/3 w-px ${light ? "bg-ink/10" : "bg-white/5"}`}
        aria-hidden="true"
      />

      <div className="site-container relative py-24 lg:py-36">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className={`h-px w-14 ${light ? "bg-brass-deep" : "bg-brass"}`} />
            <p className={`eyebrow ${light ? "!text-brass-deep" : ""}`}>{eyebrow}</p>
          </div>

          <h2
            className={`display-xl mt-8 max-w-6xl text-[clamp(3.2rem,10vw,9.5rem)] ${light ? "text-ink" : "text-paper-pure"}`}
          >
            {title}
          </h2>

          <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <p className={`body-copy max-w-xl ${light ? "!text-ink/60" : ""}`}>{description}</p>
            <Link
              href="/contact/"
              className={`group relative inline-flex min-h-14 shrink-0 items-center justify-center gap-6 overflow-hidden px-8 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 ease-editorial hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] ${
                light ? "bg-ink text-paper-pure" : "bg-brass text-paper-pure"
              }`}
            >
              <span className="relative z-10">Let&apos;s talk</span>
              <ArrowUpRight size={20} strokeWidth={1.6} aria-hidden="true" className="relative z-10 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
              <span className={`absolute inset-0 translate-y-full transition-transform duration-300 ease-editorial group-hover:translate-y-0 ${light ? "bg-brass" : "bg-background"}`}
 aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
