"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HeroVisual } from "@/components/home/HeroVisual";
import { ArrowLink } from "@/components/site/ArrowLink";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const capabilities = ["Websites", "Custom software", "AI systems"];

export function Hero() {
  const reduceMotion = useReducedMotion();

  const enter = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { y: 16, opacity: 1 },
          animate: { y: 0, opacity: 1 },
          transition: { duration: 0.75, delay, ease: EASE },
        };

  return (
    <section
      className="hero-precision relative flex min-h-dvh flex-col overflow-hidden pb-4 pt-24 lg:pt-32"
      aria-labelledby="hero-heading"
    >
      <div className="site-container relative flex flex-1 items-center py-12 lg:py-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 xl:gap-16">
          <div className="relative z-10 max-w-[640px]">
            <motion.div {...enter(0)} className="mb-6 flex items-center gap-3 sm:mb-8">
              <span className="h-px w-9 bg-brass" aria-hidden="true" />
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/70 sm:text-[11px]">
                Kamora Tech <span className="mx-1.5 text-brass">/</span> Precision Systems Studio
              </p>
            </motion.div>

            <motion.h1
              {...enter(0.08)}
              id="hero-heading"
              className="font-display text-[clamp(2.35rem,7.2vw,4.5rem)] font-light uppercase leading-[1.03] tracking-[-0.03em] text-paper"
            >
              Precision-built
              <br />
              <span className="text-brass">digital systems</span>
              <br />
              for modern business.
            </motion.h1>

            <motion.p
              {...enter(0.16)}
              className="mt-6 max-w-[52ch] font-sans text-[14px] leading-[1.8] text-paper/65 sm:mt-7 sm:text-[15px] lg:text-base"
            >
              Websites, custom software, and intelligent systems designed, built, and maintained as one connected product.
            </motion.p>

            <motion.div {...enter(0.24)} className="mt-8 flex flex-wrap gap-3 sm:mt-9">
              <ArrowLink href="/#products">Explore Products</ArrowLink>
              <ArrowLink href="/contact/" variant="outline">Contact Us</ArrowLink>
            </motion.div>

            <motion.ul
              {...enter(0.32)}
              className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-paper/10 pt-5 font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-paper/55 sm:mt-11 sm:text-[11px]"
              aria-label="Capabilities"
            >
              {capabilities.map((capability) => (
                <li key={capability} className="flex items-center gap-2">
                  <span className="h-1 w-1 bg-brass" aria-hidden="true" />
                  {capability}
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div {...enter(0.2)} className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
            <HeroVisual />
          </motion.div>
        </div>
      </div>

      <motion.div {...enter(0.4)} className="site-container relative flex items-end">
        <a
          href="#products"
          className="inline-flex min-h-10 items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/55 transition-colors hover:text-brass"
        >
          <span className="text-brass" aria-hidden="true">↓</span>
          Scroll to explore
        </a>
      </motion.div>
    </section>
  );
}
