import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/site/Reveal";
import { serviceCategories } from "@/lib/data";

export function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-28 border-b border-white/10 bg-ink py-16 md:py-20 lg:py-24">
      <div className="site-container">
        <div className="border-b border-white/10 pb-10">
          <Reveal className="max-w-3xl">
            <span className="inline-flex items-center gap-3 text-sm font-medium text-paper-dim/70">
              <span className="h-px w-8 bg-brass" aria-hidden="true" />
              What we do / 04
            </span>
            <h2 className="section-title mt-5 text-paper-pure">Services built around your goal.</h2>
            <p className="body-copy mt-5">
              From a focused website to a connected internal system, every engagement starts with your audience, your workflow and a clear definition of success.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {serviceCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Reveal key={category.id} delay={(index % 4) * 0.05} className="h-full">
                <article className="content-card group flex h-full flex-col transition-all duration-300 ease-editorial hover:-translate-y-1 hover:border-brass/60 hover:glow-brass focus-within:border-brass/60 focus-within:glow-brass">
                  <div className="flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center border border-brass/40 bg-brass/5 text-brass">
                      <Icon size={20} strokeWidth={1.4} aria-hidden="true" />
                    </span>
                    <span className="font-condense text-sm tracking-wide text-paper-faint/50">{category.number}</span>
                  </div>

                  <h3 className="mt-7 font-title text-lg font-semibold leading-snug text-paper-pure sm:text-xl">
                    {category.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-paper-dim/75">{category.description}</p>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {category.items.slice(0, 3).map((item) => (
                      <li key={item} className="border border-paper/10 px-2.5 py-1 text-[11px] tracking-[0.04em] text-paper-faint/70">
                        {item}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={category.href}
                    className="mt-auto inline-flex items-center justify-between border-b border-brass/40 pb-2 pt-8 text-sm font-medium text-brass transition-colors hover:border-brass hover:text-paper-pure focus-visible:outline-paper"
                  >
                    Learn more
                    <ArrowUpRight
                      size={16}
                      aria-hidden="true"
                      className="transition-transform duration-200 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
