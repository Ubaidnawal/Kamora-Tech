import type { Metadata } from "next";
import { ArrowUpRight, Quote } from "lucide-react";
import Link from "next/link";
import { ArrowLink } from "@/components/site/ArrowLink";
import { CTASection } from "@/components/site/CTASection";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { TiltCard } from "@/components/site/TiltCard";
import { CoreVisual } from "@/three/CoreVisual";
import { aboutValues, disciplines, standards, stats } from "@/lib/data";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Meet Kamora Tech — an independent digital studio combining design craft, 3D and engineering discipline to build websites, software and automation.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        number="01"
        label="About the studio"
        pageName="About"
        lines={[
          { text: "We make", className: "text-paper-pure" },
          { text: "technology", className: "text-outline-brass" },
          { text: "feel human.", className: "text-paper-pure" },
        ]}
        description="Kamora Tech is a small, senior team of designers and developers who believe digital work should be clear, useful and built to last. We work with businesses worldwide from wherever we are."
        meta={stats}
      >
        <ArrowLink href="/contact/" variant="outline">Work with us</ArrowLink>
      </PageHero>

      <section className="relative overflow-hidden bg-ink py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-40" aria-hidden="true" />
        <div className="site-container relative grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
          <Reveal>
            <span className="vertical-text hidden font-condense text-[11px] tracking-[0.4em] text-paper-faint lg:block">
              THE STUDIO — DESIGN / ENGINEERING
            </span>
            <p className="eyebrow mt-2">Our story</p>
          </Reveal>
          <Reveal delay={0.1}>
            <Quote size={38} strokeWidth={1} aria-hidden="true" className="text-brass/60" />
            <p className="mt-6 font-title text-2xl font-light leading-[1.4] text-paper-pure sm:text-3xl lg:text-[2.2rem]">
              We started Kamora Tech because too much digital work felt disposable. Beautiful on the surface, frustrating underneath. We wanted to build the opposite.
            </p>
            <div className="mt-10 grid gap-6 border-t border-white/10 pt-8 md:grid-cols-2">
              <p className="text-sm leading-relaxed text-paper-dim">
                What began as a focus on thoughtful websites quickly grew. Clients asked us to solve deeper problems: manage inventory, schedule appointments, bring scattered data into one place. Each challenge pushed us further into software and automation.
              </p>
              <p className="text-sm leading-relaxed text-paper-dim">
                Today we operate as one integrated team. Designers sit beside engineers. Decisions are made with the long term in mind. And every project still gets the same care we promised on day one.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-background py-24 lg:py-32">
        <div className="site-container grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
          <Reveal>
            <div className="relative aspect-[4/5] w-full border border-white/10 bg-surface/40">
              <CoreVisual variant="accent" className="absolute inset-0 h-full w-full" />
              <div className="pointer-events-none absolute left-0 top-0 h-10 w-10 border-l border-t border-brass/40" aria-hidden="true" />
              <div className="pointer-events-none absolute bottom-0 right-0 h-10 w-10 border-b border-r border-brass/40" aria-hidden="true" />
              <p className="pointer-events-none absolute bottom-4 left-4 font-condense text-[10px] tracking-[0.3em] text-paper-faint">
                DESIGN MEETS ENGINEERING
              </p>
            </div>
          </Reveal>
          <SectionHeading
            number="02"
            eyebrow="What we believe"
            title={<>Principles we<br />build on.</>}
            description="These are not values on a wall. They are the decisions we make on every project, every week."
          />
          <div className="lg:col-start-2">
            <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
              {aboutValues.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Reveal key={value.title} delay={index * 0.07} className="h-full">
                    <TiltCard max={3}>
                      <div className="flex h-full min-h-[250px] flex-col bg-background p-7">
                        <span className="font-condense text-sm tracking-widest text-brass">0{index + 1}</span>
                        <Icon size={28} strokeWidth={1.2} aria-hidden="true" className="mt-10 text-brass" />
                        <h3 className="mt-auto font-title text-xl font-medium uppercase tracking-wide text-paper-pure">{value.title}</h3>
                        <p className="mt-4 text-sm leading-relaxed text-paper-dim">{value.description}</p>
                      </div>
                    </TiltCard>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink py-24 lg:py-32">
        <div className="site-container">
          <SectionHeading
            number="03"
            eyebrow="The disciplines"
            title={<>One team,<br />many crafts.</>}
            description="No hand-offs to unknown teams. The people who shape your project are the people who build it."
          />
          <Reveal delay={0.1}>
            <ul className="mt-14 border-t border-white/10 lg:mt-20">
              {disciplines.map((discipline, index) => (
                <li key={discipline.role}>
                  <Link href="/services/" className="group flex min-h-[88px] items-center justify-between gap-6 border-b border-white/10 py-4 transition-colors hover:text-brass">
                    <span className="flex items-center gap-6">
                      <span className="font-condense text-sm text-paper-faint">{String(index + 1).padStart(2, "0")}</span>
                      <span className="font-title text-xl font-medium uppercase tracking-wide text-paper-pure transition-colors group-hover:text-brass sm:text-2xl">{discipline.role}</span>
                    </span>
                    <span className="hidden text-right text-xs text-paper-faint sm:block">{discipline.note}</span>
                    <ArrowUpRight size={18} strokeWidth={1.3} aria-hidden="true" className="shrink-0 text-brass" />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-background py-24 lg:py-32">
        <div className="site-container">
          <SectionHeading
            number="04"
            eyebrow="Our standard"
            title={<>What you can<br />count on.</>}
            description="Six commitments that stay constant, whatever the size of the project."
          />
          <div className="mt-14 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
            {standards.map((standard, index) => {
              const Icon = standard.icon;
              return (
                <Reveal key={standard.title} delay={index * 0.05} className="h-full">
                  <div className="flex h-full min-h-[210px] flex-col bg-background p-8 transition-colors hover:bg-surface">
                    <Icon size={25} strokeWidth={1.2} aria-hidden="true" className="text-brass" />
                    <h3 className="mt-auto pt-8 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">{standard.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-paper-dim">{standard.description}</p>
                    <span className="mt-5 font-condense text-xs text-paper-faint">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <CTASection
        eyebrow="Work with us"
        title="LET'S MAKE SOMETHING MEANINGFUL."
        description="Bring us the ambitious idea, the complicated problem or the project that needs a fresh perspective. We are ready."
      />
    </>
  );
}
