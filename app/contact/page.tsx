import type { Metadata } from "next";
import { Clock3, Mail, MapPin, MessageSquareText } from "lucide-react";
import { ArrowLink } from "@/components/site/ArrowLink";
import { ContactForm } from "@/components/site/ContactForm";
import { FaqAccordion } from "@/components/site/FaqAccordion";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/site/SectionHeading";
import { contactEmail, faqs } from "@/lib/data";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Talk to Kamora Tech about a website, software system or automation project. Tell us your goal and we will get back to you within one business day.",
};

const nextSteps = [
  { title: "Tell us your goal", description: "Send the form or email us. A short outline of what you need is enough to begin." },
  { title: "A focused conversation", description: "We will set up a call to understand the context, constraints and what success looks like." },
  { title: "A clear proposal", description: "You will receive a practical plan with scope, timeline and cost — no obligations." },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        number="06"
        label="Get in touch"
        pageName="Contact"
        lines={[
          { text: "Let's start a", className: "text-paper-pure" },
          { text: "conversation.", className: "text-outline-brass" },
        ]}
        description="Have a project in mind, a question about our work, or a problem that needs a fresh perspective? We would love to hear about it."
        meta={[
          { value: "< 1 day", label: "Typical reply time" },
          { value: "Remote", label: "Working worldwide" },
          { value: "Free", label: "Initial consultation" },
          { value: "01", label: "Point of contact" },
        ]}
      >
        <ArrowLink href={`mailto:${contactEmail}`} variant="outline">Email us directly</ArrowLink>
      </PageHero>

      <section className="bg-background py-24 lg:py-32">
        <div className="site-container grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <Reveal>
            <div className="border-t border-white/10">
              <h2 className="py-6 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-paper-faint">Direct lines</h2>
              <a href={`mailto:${contactEmail}`} className="group flex min-h-24 items-start gap-5 border-t border-white/10 py-6 transition-colors hover:text-brass">
                <Mail size={22} strokeWidth={1.3} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />
                <span>
                  <span className="block font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Email us</span>
                  <span className="mt-1.5 block font-title text-lg text-paper-pure transition-colors group-hover:text-brass sm:text-xl">{contactEmail}</span>
                </span>
              </a>
              <a href={`mailto:${contactEmail}?subject=Book%20a%20discovery%20call`} className="group flex min-h-24 items-start gap-5 border-t border-white/10 py-6 transition-colors hover:text-brass">
                <MessageSquareText size={22} strokeWidth={1.3} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />
                <span>
                  <span className="block font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Book a call</span>
                  <span className="mt-1.5 block font-title text-lg text-paper-pure transition-colors group-hover:text-brass sm:text-xl">Arrange a discovery call</span>
                </span>
              </a>
              <div className="flex min-h-24 items-start gap-5 border-y border-white/10 py-6">
                <MapPin size={22} strokeWidth={1.3} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />
                <span>
                  <span className="block font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Based in</span>
                  <span className="mt-1.5 block font-title text-lg text-paper-pure sm:text-xl">Working worldwide</span>
                  <span className="mt-1 block text-sm text-paper-dim">Remote-first studio · flexible hours</span>
                </span>
              </div>
            </div>

            <div className="mt-10 flex items-start gap-4 border border-brass/25 bg-brass/[0.04] p-6">
              <Clock3 size={20} strokeWidth={1.4} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />
              <p className="text-sm leading-relaxed text-paper-dim">
                We usually reply within one business day. For time-sensitive enquiries, email us directly and put &ldquo;Urgent&rdquo; in the subject line.
              </p>
            </div>

            <div className="mt-12">
              <p className="eyebrow">What happens next</p>
              <ol className="mt-6 space-y-6">
                {nextSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-5">
                    <span className="font-condense text-lg text-brass">{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block font-title text-base font-medium uppercase tracking-wide text-paper-pure">{step.title}</span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-paper-dim">{step.description}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          <Reveal delay={0.1}><ContactForm /></Reveal>
        </div>
      </section>

      <section className="border-y border-white/10 bg-ink py-24 lg:py-32">
        <div className="site-container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <SectionHeading number="01" eyebrow="Before you write" title={<>Frequently<br />asked questions.</>} description="A few answers that may help you frame your enquiry." />
          <Reveal delay={0.1}><FaqAccordion items={faqs.slice(0, 6)} /></Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-background py-24 lg:py-36">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" aria-hidden="true" />
        <div className="site-container relative text-center">
          <MessageSquareText size={34} strokeWidth={1} aria-hidden="true" className="mx-auto text-brass" />
          <p className="eyebrow mt-8">Prefer email?</p>
          <h2 className="display-xl mt-6 text-[clamp(2.6rem,7vw,6.5rem)] text-paper-pure">Write to us<br /><span className="text-outline-brass">anytime.</span></h2>
          <a href={`mailto:${contactEmail}`} className="mt-10 inline-flex min-h-14 items-center gap-3 border-b border-brass pb-2 font-title text-xl uppercase tracking-wide text-brass transition-colors hover:text-paper-pure sm:text-2xl">
            {contactEmail}
          </a>
        </div>
      </section>
    </>
  );
}
