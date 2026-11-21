import type { Metadata } from "next";
import {
  Blocks,
  Boxes,
  Building2,
  CalendarCheck2,
  Car,
  ClipboardList,
  Code2,
  GraduationCap,
  HeartPulse,
  Hotel,
  LayoutDashboard,
  Network,
  ReceiptText,
  ScanLine,
  UtensilsCrossed,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { ArrowLink } from "@/components/site/ArrowLink";
import { CTASection } from "@/components/site/CTASection";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { TiltCard } from "@/components/site/TiltCard";
import { managementSystems, softwareSolutions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Software Development",
  description:
    "Custom ERP, CRM, POS, billing, dashboards and management systems that remove repetitive work and bring clarity to your operations.",
};

const solutionIcons: LucideIcon[] = [
  Boxes, UsersRound, ScanLine, ReceiptText, Code2, LayoutDashboard, UsersRound, CalendarCheck2, Workflow,
];

const systemIcons: LucideIcon[] = [
  GraduationCap, HeartPulse, UtensilsCrossed, Hotel, Car, Building2,
  Boxes, UsersRound, ReceiptText, ClipboardList, CalendarCheck2, CalendarCheck2,
];

const differentiators = [
  { title: "Shaped around reality", description: "We map how your team actually works, then build software around that — not the other way around.", icon: Workflow },
  { title: "Clear interfaces", description: "Dense data, presented calmly. People can learn our systems quickly and use them confidently.", icon: LayoutDashboard },
  { title: "Ready to connect", description: "Designed to fit with the tools you already rely on, from payment systems to accounting platforms.", icon: Network },
  { title: "Built for change", description: "Modular architecture and documented code make future improvements straightforward.", icon: Blocks },
];

export default function SoftwareDevelopmentPage() {
  return (
    <>
      <PageHero
        number="04"
        label="Software development"
        pageName="Software Development"
        lines={[
          { text: "Software built", className: "text-paper-pure" },
          { text: "around your", className: "text-paper-pure" },
          { text: "business.", className: "text-brass" },
        ]}
        description="When off-the-shelf tools stop fitting, custom software starts making sense. We build focused systems that remove repetitive work, connect your data and give your team back time."
        meta={[
          { value: "09", label: "Solution areas" },
          { value: "12", label: "Management systems" },
          { value: "End-to-end", label: "Design & build" },
          { value: "Ongoing", label: "Support available" },
        ]}
      >
        <ArrowLink href="/contact/" variant="outline">Discuss a system</ArrowLink>
      </PageHero>

      <section className="bg-background py-24 lg:py-32">
        <div className="site-container">
          <SectionHeading
            number="01"
            eyebrow="Custom solutions"
            title={<>The software your<br />operations need.</>}
            description="From a single focused tool to a complete business platform, we build software with a clear job to do."
          />
          <div className="mt-14 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
            {softwareSolutions.map((solution, index) => {
              const Icon = solutionIcons[index];
              return (
                <Reveal key={solution} delay={(index % 3) * 0.05} className="h-full">
                  <TiltCard max={4}>
                    <div className="group flex h-full min-h-[200px] flex-col justify-between bg-background p-7 transition-colors duration-200 hover:bg-surface">
                      <div className="flex items-start justify-between">
                        <Icon size={24} strokeWidth={1.2} aria-hidden="true" className="text-brass" />
                        <span className="font-condense text-xs tracking-widest text-paper-faint">{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <h3 className="mt-10 font-title text-lg font-medium uppercase leading-snug tracking-wide text-paper-pure sm:text-xl">{solution}</h3>
                    </div>
                  </TiltCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-ink py-24 lg:py-32">
        <div className="site-container">
          <SectionHeading
            number="02"
            eyebrow="Management systems"
            title={<>Industry-specific<br />systems.</>}
            description="Purpose-built tools for the way different organisations operate. Each one can be tailored to your workflows, roles and reporting needs."
          />
          <div className="mt-14 grid gap-x-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
            {managementSystems.map((system, index) => {
              const Icon = systemIcons[index];
              return (
                <Reveal key={system} delay={(index % 3) * 0.04}>
                  <div className="group flex min-h-[78px] items-center gap-4 border-b border-white/10 py-4 transition-colors hover:border-brass/50">
                    <Icon size={21} strokeWidth={1.2} aria-hidden="true" className="shrink-0 text-brass" />
                    <span className="flex-1 font-title text-sm font-medium uppercase tracking-wide text-paper-dim transition-colors group-hover:text-paper-pure sm:text-base">{system}</span>
                    <span className="font-condense text-xs text-paper-faint">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-background py-24 lg:py-32">
        <div className="site-container">
          <SectionHeading
            number="03"
            eyebrow="Our approach"
            title={<>Software people<br />actually want to use.</>}
            description="Powerful does not have to mean complicated. These principles guide every system we build."
          />
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
            {differentiators.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.title} delay={index * 0.06}>
                  <div className="border-t border-brass/40 pt-6">
                    <Icon size={25} strokeWidth={1.2} aria-hidden="true" className="text-brass" />
                    <h3 className="mt-6 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-paper-dim">{item.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-ink py-24 lg:py-32">
        <div className="site-container relative overflow-hidden border border-white/10 p-8 sm:p-14 lg:p-20">
          <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-50" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brass/[0.08] blur-[90px]" aria-hidden="true" />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <Reveal>
              <p className="eyebrow">Have a process in mind?</p>
              <h2 className="display-lg mt-6 text-[clamp(2.4rem,5.4vw,5rem)] text-paper-pure">
                If it can be<br />
                <span className="text-outline-brass">streamlined,</span><br />
                we can build it.
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="body-copy">
                Bring us the spreadsheet, the manual process or the tool everyone complains about. We will map it, simplify it and turn it into something your team can rely on.
              </p>
              <ArrowLink href="/contact/" className="mt-8">Start the conversation</ArrowLink>
            </Reveal>
          </div>
        </div>
      </section>

      <CTASection
        eyebrow="Custom software"
        title="LET'S SOLVE THE RIGHT PROBLEM."
        description="We start with your workflow, not a feature list. Tell us where the friction is and we will design the system that removes it."
      />
    </>
  );
}
