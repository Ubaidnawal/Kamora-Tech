import type { Metadata } from "next";
import { ArrowRight, MoveUpRight } from "lucide-react";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ServicesSection } from "@/components/home/ServicesSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { WhyChoose } from "@/components/home/WhyChoose";
import { ArrowLink } from "@/components/site/ArrowLink";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { Marquee } from "@/components/site/Marquee";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Reveal } from "@/components/site/Reveal";
import { faqs, projects, standards } from "@/lib/data";

export const metadata: Metadata = {
  title: "Kamora Tech — Websites, Software & Digital Solutions",
  description:
    "Explore Kamora Tech websites, management systems, ERP, CRM and custom software solutions. Build your enquiry list and request a fixed-scope proposal.",
  openGraph: {
    title: "Kamora Tech — Premium Websites & Software Solutions",
    description:
      "Professional website development, management systems, ERP, CRM and custom software from Kamora Tech.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <Marquee />

      <section id="work" className="scroll-mt-28 border-b border-white/10 bg-background py-16 md:py-20 lg:py-24">
        <div className="site-container">
          <div className="flex flex-col gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
            <Reveal className="max-w-3xl">
              <span className="inline-flex items-center gap-3 text-sm font-medium text-paper-dim/70">
                <span className="h-px w-8 bg-brass" aria-hidden="true" />
                Selected work / 02
              </span>
              <h2 className="section-title mt-5 text-paper-pure">Proof in the making.</h2>
              <p className="body-copy mt-5">
                Representative project types — a closer look at what we build and how we approach it.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <ArrowLink href="/portfolio/" variant="text">View all work</ArrowLink>
            </Reveal>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((project, index) => (
              <Reveal key={project.id} delay={index * 0.06} className="h-full">
                <ProjectCard project={project} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <WhyChoose />
      <ServicesSection />
      <HowItWorks />
      <TestimonialsSection />

      <section id="standard" className="scroll-mt-28 border-b border-white/10 bg-ink py-16 md:py-20 lg:py-24">
        <div className="site-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal className="max-w-3xl">
            <span className="inline-flex items-center gap-3 text-sm font-medium text-paper-dim/70">
              <span className="h-px w-8 bg-brass" aria-hidden="true" />
              06 / The Kamora standard
            </span>
            <h2 className="section-title mt-5 text-paper-pure">Built with intention.</h2>
            <p className="body-copy mt-5">
              A short set of commitments that shape every website, system and interaction we deliver.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid gap-5 sm:grid-cols-2">
              {standards.map((standard, index) => {
                const Icon = standard.icon;
                return (
                  <div
                    key={standard.title}
                    className="content-card min-h-[190px] transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:border-brass/50 hover:glow-brass"
                  >
                    <div className="flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center border border-brass/40 bg-brass/5 text-brass">
                        <Icon size={20} strokeWidth={1.4} aria-hidden="true" />
                      </span>
                      <span className="font-condense text-sm tracking-wide text-paper-faint/50">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="mt-6 font-title text-lg font-semibold leading-snug text-paper-pure sm:text-xl">
                      {standard.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-paper-dim/75">{standard.description}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="faq" className="scroll-mt-28 border-b border-white/10 bg-background py-16 md:py-20 lg:py-24">
        <div className="site-container grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <span className="inline-flex items-center gap-3 text-sm font-medium text-paper-dim/70">
              <span className="h-px w-8 bg-brass" aria-hidden="true" />
              Common questions / 07
            </span>
            <h2 className="section-title mt-5 text-paper-pure">Answers, up front.</h2>
            <p className="body-copy mt-5">Still curious? We are happy to talk through your specific situation.</p>
            <ArrowLink href="/contact/" variant="outline" className="mt-8">Ask us directly</ArrowLink>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="content-card overflow-hidden !p-0">
              <FaqAccordion items={faqs.slice(0, 6)} />
            </div>
          </Reveal>
        </div>
      </section>

      <section id="cta" className="relative scroll-mt-28 overflow-hidden border-t border-paper/20 bg-brass py-16 text-paper-pure md:py-20 lg:py-24">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-paper/50 to-transparent" aria-hidden="true" />
        <div className="site-container relative">
          <Reveal className="max-w-4xl">
            <span className="inline-flex items-center gap-3 text-sm font-medium text-paper-pure/75">
              <span className="h-px w-8 bg-paper/60" aria-hidden="true" />
              Ready when you are
            </span>
            <h2 className="section-title mt-6 max-w-3xl text-paper-pure lg:text-[40px]">
              Ready to Build Something Amazing?
            </h2>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-paper-pure/80 sm:text-base">
              Let&apos;s transform your ideas into powerful websites and software solutions that help your business move forward.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href="/contact/"
                className="group inline-flex min-h-13 items-center justify-center gap-3 bg-paper px-7 py-4 text-sm font-semibold text-ink transition-all duration-200 ease-editorial hover:-translate-y-0.5 hover:bg-background hover:text-paper-pure active:translate-y-0 focus-visible:outline-paper"
              >
                Start Your Project
                <MoveUpRight
                  size={17}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  className="transition-transform duration-200 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
              <Link
                href="/#products"
                className="group inline-flex min-h-13 items-center justify-center gap-3 border border-paper/70 px-7 py-4 text-sm font-semibold text-paper-pure transition-all duration-200 ease-editorial hover:-translate-y-0.5 hover:bg-paper hover:text-ink active:translate-y-0 focus-visible:outline-paper"
              >
                Explore Our Products
                <ArrowRight
                  size={17}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  className="transition-transform duration-200 ease-editorial group-hover:translate-x-1"
                />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
