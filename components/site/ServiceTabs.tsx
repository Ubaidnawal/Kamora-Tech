"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { serviceCategories } from "@/lib/data";
import { TiltCard } from "./TiltCard";

export function ServiceTabs() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const category = serviceCategories[active];
  const Icon = category.icon;

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % serviceCategories.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + serviceCategories.length) % serviceCategories.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = serviceCategories.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
      <div role="tablist" aria-label="Service categories" aria-orientation="vertical" className="flex flex-col border-t border-white/10">
        {serviceCategories.map((item, index) => {
          const ItemIcon = item.icon;
          const selected = index === active;
          return (
            <button
              key={item.id}
              ref={(el) => {
                tabs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`service-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`service-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`group relative flex min-h-[96px] items-center gap-5 border-b border-white/10 px-3 py-4 text-left transition-colors duration-200 ${
                selected ? "bg-white/[0.035]" : "hover:bg-white/[0.02]"
              }`}
            >
              {selected && <motion.span layoutId="service-active" className="absolute inset-y-0 left-0 w-0.5 bg-brass" transition={{ duration: reduceMotion ? 0 : 0.3 }} />}
              <span className={`font-condense text-sm tracking-widest ${selected ? "text-brass" : "text-paper-faint"}`}>
                {item.number}
              </span>
              <ItemIcon size={22} strokeWidth={1.2} aria-hidden="true" className={selected ? "text-brass" : "text-paper-faint"} />
              <span className="min-w-0 flex-1">
                <span className={`block font-title text-lg font-medium uppercase tracking-wide transition-colors sm:text-xl ${selected ? "text-paper-pure" : "text-paper-dim"}`}>
                  {item.title}
                </span>
                <span className="mt-0.5 block truncate font-sans text-xs text-paper-faint">{item.short}</span>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" className={`shrink-0 text-brass transition-all duration-300 ${selected ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"}`} />
            </button>
          );
        })}
      </div>

      <div className="relative min-h-[560px] border border-white/10 bg-surface p-6 sm:p-9 lg:min-h-[600px]">
        <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-50" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden" aria-hidden="true">
          <span className="block h-px w-1/3 animate-scan bg-gradient-to-r from-transparent via-brass/70 to-transparent" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={category.id}
            id={`service-panel-${category.id}`}
            role="tabpanel"
            aria-labelledby={`service-tab-${category.id}`}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <TiltCard max={3}>
              <div className="border border-white/10 bg-background/60 p-7 backdrop-blur-sm sm:p-9">
                <div className="flex items-start justify-between gap-6">
                  <Icon size={36} strokeWidth={1} aria-hidden="true" className="text-brass" />
                  <span className="font-condense text-xs tracking-[0.24em] text-paper-faint">CAPABILITY {category.number}</span>
                </div>
                <h3 className="display-md mt-8 text-3xl text-paper-pure sm:text-4xl">{category.title}</h3>
                <p className="body-copy mt-5">{category.description}</p>

                <div className="mt-8 grid gap-x-7 sm:grid-cols-2">
                  {category.items.map((item, itemIndex) => (
                    <div key={`${item}-${itemIndex}`} className="flex items-start gap-3 border-b border-white/[0.07] py-2.5">
                      <span className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-brass" aria-hidden="true" />
                      <span className="text-[13px] leading-snug text-paper-dim">
                        <span className="mr-2 font-condense text-[10px] text-paper-faint">{String(itemIndex + 1).padStart(2, "0")}</span>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>

            <Link
              href={category.href}
              className="mt-7 inline-flex min-h-12 items-center gap-3 border-b border-brass pb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-brass transition-colors hover:text-paper-pure"
            >
              Explore {category.title.toLowerCase()}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
