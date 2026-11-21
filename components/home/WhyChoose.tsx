import { Reveal } from "@/components/site/Reveal";
import { whyUs } from "@/lib/data";

export function WhyChoose() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-paper py-16 text-ink md:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-40" aria-hidden="true" />
      <div className="site-container relative">
        <div className="border-b border-ink/10 pb-10">
          <Reveal className="max-w-3xl">
            <span className="inline-flex items-center gap-3 text-sm font-medium text-ink/60">
              <span className="h-px w-8 bg-brass" aria-hidden="true" />
              Why Kamora Tech / 03
            </span>
            <h2 className="section-title mt-5 text-ink">Why Choose Kamora Tech?</h2>
            <p className="body-copy mt-5 !text-ink/70">
              A focused studio combining design craft, engineering discipline and clear communication on every project.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyUs.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <Reveal key={reason.title} delay={(index % 3) * 0.05} className="h-full">
                <div className="group flex h-full min-h-[220px] flex-col justify-between rounded-lg border border-ink/10 bg-ink/[0.02] p-6 transition-all duration-300 ease-editorial hover:-translate-y-0.5 hover:border-brass/40 hover:bg-ink/[0.04] sm:p-7">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center border border-brass/40 bg-brass/[0.06] text-brass">
                      <Icon size={20} strokeWidth={1.4} aria-hidden="true" />
                    </span>
                    <span className="font-condense text-sm tracking-wide text-ink/40">{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="mt-8">
                    <h3 className="font-title text-lg font-semibold leading-snug text-ink sm:text-xl">{reason.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink/70">{reason.description}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
