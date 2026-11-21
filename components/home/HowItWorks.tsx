import { Code2, Headset, Layers3, Send, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/site/Reveal";

const steps = [
  {
    number: "01",
    title: "Discuss Your Idea",
    description: "We listen, ask the right questions and define what success looks like for your business.",
    detail: "Discovery call · goals · audience",
    icon: Send,
  },
  {
    number: "02",
    title: "Planning & Strategy",
    description: "Structure, content and technical direction come together in a clear, practical plan.",
    detail: "Sitemap · architecture · roadmap",
    icon: Layers3,
  },
  {
    number: "03",
    title: "Design & Development",
    description: "Visual language and working software are shaped in focused, reviewable iterations.",
    detail: "Art direction · interface · code",
    icon: Code2,
  },
  {
    number: "04",
    title: "Testing & Delivery",
    description: "Every detail is checked across devices, browsers and accessibility needs before launch.",
    detail: "QA · performance · accessibility",
    icon: ShieldCheck,
  },
  {
    number: "05",
    title: "Support & Maintenance",
    description: "We hand over clearly and stay available for updates, monitoring and ongoing care.",
    detail: "Documentation · care · support",
    icon: Headset,
  },
];

export function HowItWorks() {
  return (
    <section id="process" className="relative scroll-mt-28 border-b border-white/10 bg-background py-16 md:py-20 lg:py-24">
      <div className="pointer-events-none absolute -right-40 top-1/4 h-[420px] w-[420px] rounded-full bg-brass/[0.06] blur-[120px]" aria-hidden="true" />
      <div className="site-container relative">
        <div className="border-b border-white/10 pb-10">
          <Reveal className="max-w-3xl">
            <span className="inline-flex items-center gap-3 text-sm font-medium text-paper-dim/70">
              <span className="h-px w-8 bg-brass" aria-hidden="true" />
              How it works / 05
            </span>
            <h2 className="section-title mt-5 text-paper-pure">From idea to impact.</h2>
            <p className="body-copy mt-5">
              A calm, predictable process with clear checkpoints, so you always know what is happening and what comes next.
            </p>
          </Reveal>
        </div>

        <div className="relative mt-10">
          <div className="absolute left-7 top-0 hidden h-full w-px bg-white/10 md:block" aria-hidden="true" />
          <ol className="space-y-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.number} className="relative grid gap-4 md:grid-cols-[56px_1fr] md:gap-8">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center border border-brass/40 bg-background text-brass">
                    <Icon size={20} strokeWidth={1.4} aria-hidden="true" />
                  </div>
                  <Reveal delay={(index % 3) * 0.05} className="h-full">
                    <div className="content-card transition-all duration-300 ease-editorial hover:border-brass/40 hover:bg-paper/[0.04]">
                      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                        <span className="font-condense text-sm tracking-wide text-brass/80">{step.number}</span>
                        <h3 className="font-title text-lg font-semibold leading-snug text-paper-pure sm:text-xl">{step.title}</h3>
                      </div>
                      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-paper-dim/75">{step.description}</p>
                      <p className="mt-4 border-t border-paper/10 pt-4 text-xs tracking-[0.04em] text-paper-faint/60">{step.detail}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
