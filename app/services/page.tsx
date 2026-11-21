import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { ArrowLink } from "@/components/site/ArrowLink";
import { CTASection } from "@/components/site/CTASection";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { TiltCard } from "@/components/site/TiltCard";
import { CoreVisual } from "@/three/CoreVisual";
import { engagementModels, faqs, serviceCategories, techStack } from "@/lib/data";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Explore the complete Kamora Tech offering: website development, management systems, custom software, e-commerce, optimisation and business automation.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        number="02"
        label="Our capabilities"
        pageName="Services"
        lines={[
          { text: "Everything you", className: "text-paper-pure" },
          { text: "need to grow", className: "text-paper-pure" },
          { text: "digitally.", className: "text-brass" },
        ]}
        description="One partner for the whole digital picture. We design, build, launch and improve websites, software and systems that work together — and keep working long after delivery."
        meta={[
          { value: "04", label: "Core disciplines" },
          { value: "20", label: "Website types" },
          { value: "12", label: "Management systems" },
          { value: "01", label: "Accountable partner" },
        ]}
      >
        <ArrowLink href="/contact/" variant="outline">Discuss your project</ArrowLink>
      </PageHero>

      <section className="bg-background py-24 lg:py-32">
        <div className="site-container">
          <SectionHeading
            number="01"
            eyebrow="Service architecture"
            title={<>The full<br />picture.</>}
            description="Explore each discipline in detail. Every service can be tailored to the scale, stage and ambitions of your business."
          />

          <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-[0.36fr_1fr] lg:gap-20">
            <aside className="hidden lg:block">
              <nav aria-label="Service categories" className="sticky top-32 border-t border-white/10">
                <p className="py-5 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-paper-faint">On this page</p>
                {serviceCategories.map((category) => (
                  <a key={category.id} href={`#${category.id}`} className="group flex min-h-14 items-center gap-4 border-b border-white/10 py-3 font-title text-sm uppercase tracking-wide text-paper-dim transition-colors hover:text-brass">
                    <span className="font-condense text-xs text-brass">{category.number}</span>
                    {category.title}
                    <ArrowUpRight size={14} aria-hidden="true" className="ml-auto opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                ))}
              </nav>
            </aside>

            <div className="space-y-20 lg:space-y-28">
              {serviceCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <article key={category.id} id={category.id} className="scroll-mt-32">
                    <Reveal>
                      <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-5">
                          <span className="font-condense text-xl tracking-widest text-brass">{category.number}</span>
                          <div>
                            <Icon size={28} strokeWidth={1.2} aria-hidden="true" className="mb-4 text-brass" />
                            <h2 className="display-md text-3xl text-paper-pure sm:text-4xl">{category.title}</h2>
                            <p className="mt-2 font-sans text-xs uppercase tracking-[0.18em] text-brass/80">{category.short}</p>
                          </div>
                        </div>
                        <Link href={category.href} className="group inline-flex min-h-11 shrink-0 items-center gap-2 border-b border-brass pb-1 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass transition-colors hover:text-paper-pure">
                          Explore
                          <ArrowUpRight size={15} aria-hidden="true" />
                        </Link>
                      </div>
                      <p className="body-copy mt-7">{category.description}</p>
                    </Reveal>
                    <div className="mt-9 grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
                      {category.items.map((item, index) => (
                        <Reveal key={`${item}-${index}`} delay={(index % 6) * 0.03}>
                          <div className="flex min-h-[54px] items-start gap-3 border-b border-white/[0.07] py-3">
                            <Check size={14} strokeWidth={1.6} aria-hidden="true" className="mt-1 shrink-0 text-brass" />
                            <span className="text-[13px] leading-snug text-paper-dim">{item}</span>
                          </div>
                        </Reveal>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-ink py-24 lg:py-32">
        <div className="site-container">
          <SectionHeading
            number="02"
            eyebrow="Ways to work together"
            title={<>Choose the shape<br />that fits.</>}
            description="Every engagement starts with a conversation. From there, we agree on the structure that gives you the most value."
          />
          <div className="mt-14 grid gap-px border border-white/10 bg-white/10 lg:mt-20 lg:grid-cols-3">
            {engagementModels.map((model, index) => (
              <Reveal key={model.title} delay={index * 0.07} className="h-full">
                <TiltCard max={3}>
                  <div className="flex h-full min-h-[320px] flex-col bg-ink p-8 lg:p-10">
                    <span className="font-condense text-sm tracking-widest text-brass">0{index + 1}</span>
                    <h3 className="mt-12 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">{model.title}</h3>
                    <p className="mt-5 text-sm leading-relaxed text-paper-dim">{model.description}</p>
                    <p className="mt-auto border-t border-white/10 pt-6 font-sans text-[10px] uppercase tracking-[0.16em] text-brass">{model.meta}</p>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-background py-24 lg:py-32">
        <div className="pointer-events-none absolute -right-40 top-10 h-[560px] w-[560px] opacity-40">
          <CoreVisual variant="accent" className="h-full w-full" />
        </div>
        <div className="site-container relative grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading
            number="03"
            eyebrow="Our toolkit"
            title={<>Modern tools.<br />Lasting results.</>}
            description="We choose technologies for their longevity, performance and fit — not their novelty."
          />
          <Reveal delay={0.1}>
            <div className="grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
              {techStack.map((tech) => (
                <div key={tech.name} className="flex min-h-[110px] flex-col justify-center bg-background/90 p-6 transition-colors hover:bg-surface">
                  <p className="font-title text-xl font-medium uppercase tracking-wide text-paper-pure">{tech.name}</p>
                  <p className="mt-2 font-sans text-xs text-paper-faint">{tech.note}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-white/10 bg-background py-24 lg:py-32">
        <div className="site-container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading number="04" eyebrow="Good to know" title={<>Questions,<br />answered.</>} description="A few things clients usually ask before we begin." />
          <Reveal delay={0.1}><FaqAccordion items={faqs.slice(0, 5)} /></Reveal>
        </div>
      </section>

      <CTASection
        eyebrow="Not sure where to start?"
        title="TELL US THE GOAL. WE'LL FIND THE ROUTE."
        description="Share what you are trying to achieve and we will recommend the right combination of services for your stage and budget."
      />
    </>
  );
}
