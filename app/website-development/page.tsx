import type { Metadata } from "next";
import {
  Accessibility,
  Building2,
  Car,
  Code2,
  Gauge,
  Globe2,
  GraduationCap,
  HeartPulse,
  Hotel,
  Layers3,
  LockKeyhole,
  Newspaper,
  PenLine,
  Plane,
  Rocket,
  Scale,
  Search,
  ShoppingCart,
  Stethoscope,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { ArrowLink } from "@/components/site/ArrowLink";
import { CTASection } from "@/components/site/CTASection";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { TiltCard } from "@/components/site/TiltCard";
import { maintenanceServices, processSteps, websiteTypes } from "@/lib/data";

export const metadata: Metadata = {
  title: "Website Development",
  description:
    "Custom business, corporate, portfolio, e-commerce and industry-specific websites — designed beautifully and engineered to perform.",
};

const typeIcons: LucideIcon[] = [
  ShoppingCart, Building2, Globe2, Layers3, PenLine, Newspaper, Rocket, UtensilsCrossed,
  HeartPulse, GraduationCap, Hotel, Plane, Building2, Car, Scale, Stethoscope,
  GraduationCap, Newspaper, Layers3, Code2,
];

const includes = [
  { title: "Strategy & structure", description: "We map your audience, goals and content before a single pixel is placed.", icon: Layers3 },
  { title: "Responsive by design", description: "Every layout is composed for phone, tablet and widescreen from the start.", icon: Globe2 },
  { title: "Fast loading", description: "Optimised assets and lean code keep pages quick on every connection.", icon: Gauge },
  { title: "Search foundations", description: "Clear semantics, metadata and structure give your site a strong starting point.", icon: Search },
  { title: "Accessible to all", description: "Keyboard, screen reader and reduced-motion support are built in.", icon: Accessibility },
  { title: "Easy to manage", description: "Intuitive content interfaces so your team can publish without help.", icon: PenLine },
  { title: "Secure & dependable", description: "Sensible permissions, updates and backups protect what you have built.", icon: LockKeyhole },
  { title: "Measurable", description: "Analytics-ready structure so you can see what is working and improve it.", icon: Rocket },
];

export default function WebsiteDevelopmentPage() {
  return (
    <>
      <PageHero
        number="03"
        label="Website development"
        pageName="Website Development"
        lines={[
          { text: "Websites that", className: "text-paper-pure" },
          { text: "earn", className: "text-paper-pure" },
          { text: "attention.", className: "text-outline-brass" },
        ]}
        description="A website is often the first conversation your business has with the world. We make sure it is a good one — clear, beautiful, fast and built around the action you want people to take."
        meta={[
          { value: "20", label: "Website types" },
          { value: "100%", label: "Responsive" },
          { value: "06", label: "Delivery stages" },
          { value: "Ongoing", label: "Care available" },
        ]}
      >
        <ArrowLink href="/portfolio/" variant="outline">See our work</ArrowLink>
      </PageHero>

      <section className="bg-background py-24 lg:py-32">
        <div className="site-container">
          <SectionHeading
            number="01"
            eyebrow="What we build"
            title={<>Every kind of site.<br />One standard of care.</>}
            description="Whether you need a focused landing page or a complex multi-section platform, the thinking, craft and attention are the same."
          />
          <div className="mt-14 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
            {websiteTypes.map((type, index) => {
              const Icon = typeIcons[index];
              return (
                <Reveal key={`${type}-${index}`} delay={(index % 4) * 0.04} className="h-full">
                  <TiltCard max={4}>
                    <div className="group flex h-full min-h-[160px] flex-col justify-between bg-background p-6 transition-colors duration-200 hover:bg-surface">
                      <div className="flex items-start justify-between">
                        <Icon size={23} strokeWidth={1.2} aria-hidden="true" className="text-brass" />
                        <span className="font-condense text-xs tracking-widest text-paper-faint">{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <p className="mt-8 font-title text-sm font-medium uppercase leading-snug tracking-wide text-paper-dim transition-colors group-hover:text-paper-pure sm:text-base">{type}</p>
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
            eyebrow="Included in every build"
            title={<>The details that<br />make it work.</>}
            description="A great website is more than a good-looking homepage. These foundations come standard."
          />
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
            {includes.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={(index % 4) * 0.06}>
                  <div className="border-t border-brass/40 pt-6">
                    <Icon size={24} strokeWidth={1.2} aria-hidden="true" className="text-brass" />
                    <h3 className="mt-6 font-title text-lg font-medium uppercase tracking-wide text-paper-pure">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-paper-dim">{feature.description}</p>
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
            eyebrow="How it happens"
            title={<>From brief to<br />browse-ready.</>}
            description="A calm, predictable process with clear checkpoints and no guesswork."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.number} delay={index * 0.05}>
                  <div className="flex h-full flex-col border border-white/10 bg-surface p-7">
                    <div className="flex items-center justify-between">
                      <span className="font-condense text-sm tracking-widest text-brass">{step.number}</span>
                      <Icon size={22} strokeWidth={1.2} aria-hidden="true" className="text-brass" />
                    </div>
                    <h3 className="mt-9 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">{step.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-paper-dim">{step.description}</p>
                    <p className="mt-auto border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.14em] text-brass/80">{step.detail}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-ink py-24 lg:py-32">
        <div className="site-container grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <SectionHeading
            number="04"
            eyebrow="Care & optimisation"
            title={<>Launch is the<br />beginning.</>}
            description="Websites need attention to stay fast, secure and relevant. Our care plans take that weight off your team."
          />
          <Reveal delay={0.1}>
            <div className="grid gap-x-8 sm:grid-cols-2">
              {maintenanceServices.map((service) => (
                <div key={service} className="flex min-h-[56px] items-center gap-3 border-b border-white/10 py-3">
                  <span className="h-1.5 w-1.5 rotate-45 bg-brass" aria-hidden="true" />
                  <span className="text-sm text-paper-dim">{service}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <CTASection
        eyebrow="Your next website"
        title="LET'S MAKE YOUR SITE WORK HARDER."
        description="Tell us about your business and the result you want. We will come back with a clear, practical plan."
      />
    </>
  );
}
