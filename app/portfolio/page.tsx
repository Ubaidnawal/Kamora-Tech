import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { ArrowLink } from "@/components/site/ArrowLink";
import { CTASection } from "@/components/site/CTASection";
import { PageHero } from "@/components/site/PageHero";
import { ProjectVisual } from "@/components/site/ProjectVisual";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { PortfolioGrid } from "@/components/site/PortfolioGrid";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Explore the types of websites, dashboards, e-commerce stores and automation systems designed and built by Kamora Tech.",
};

export default function PortfolioPage() {
  return (
    <>
      <PageHero
        number="05"
        label="Selected work"
        pageName="Portfolio"
        lines={[
          { text: "Work that", className: "text-paper-pure" },
          { text: "speaks", className: "text-paper-pure" },
          { text: "for itself.", className: "text-outline-brass" },
        ]}
        description="Every project starts with a real business problem and ends with a digital product that makes life easier. Explore the work types below to see the range of what we build."
        meta={[
          { value: "06", label: "Work types shown" },
          { value: "04", label: "Disciplines" },
          { value: "100%", label: "Custom built" },
          { value: "01", label: "Shared standard" },
        ]}
      />

      <section className="bg-background py-24 lg:py-32">
        <div className="site-container">
          <SectionHeading
            number="01"
            eyebrow="The portfolio"
            title={<>Explore the<br />projects.</>}
            description="Filter by discipline to see the range of work — from editorial websites to operational software. These are representative project types, not client case studies."
          />
          <div className="mt-16 lg:mt-20"><PortfolioGrid /></div>
        </div>
      </section>

      <section id="operations-dashboard" className="scroll-mt-32 border-y border-white/10 bg-ink py-24 lg:py-32">
        <div className="site-container grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
          <Reveal>
            <p className="eyebrow">Featured work type · Software</p>
            <h2 className="display-lg mt-7 text-[clamp(2.5rem,5.8vw,5.2rem)] text-paper-pure">
              Operations <span className="text-outline-brass">Dashboard.</span>
            </h2>
            <p className="body-copy mt-7">
              Many teams still run daily operations across disconnected spreadsheets. Information is duplicated, decisions are slow, and no one has a clear view of the whole picture.
            </p>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div className="border-t border-brass/40 pt-5">
                <h3 className="font-title text-sm font-semibold uppercase tracking-[0.16em] text-brass">The approach</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                  We map the real workflow with the team, then design a single role-based dashboard with live data, clear exceptions and simple reporting.
                </p>
              </div>
              <div className="border-t border-brass/40 pt-5">
                <h3 className="font-title text-sm font-semibold uppercase tracking-[0.16em] text-brass">The outcome</h3>
                <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                  One dependable source of truth, fewer manual steps and an interface people can learn quickly.
                </p>
              </div>
            </div>
            <ArrowLink href="/contact/" variant="outline" className="mt-10">Build your system</ArrowLink>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="relative border border-white/10 p-3 sm:p-5">
              <ProjectVisual variant="dashboard" />
              <div className="mt-4 flex items-center justify-between px-2 pb-1">
                <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-paper-faint">Operations overview · role-based access</p>
                <ArrowUpRight size={16} aria-hidden="true" className="text-brass" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CTASection
        eyebrow="Your project could be next"
        title="LET'S CREATE SOMETHING WORTH SHOWING."
        description="Tell us where your business is headed. We will bring the design thinking and engineering to get you there."
      />
    </>
  );
}
