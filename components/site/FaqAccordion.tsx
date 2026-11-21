"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { Faq } from "@/lib/data";

export function FaqAccordion({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const reduceMotion = useReducedMotion();

  return (
    <div className="border-t border-white/10">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <div key={item.question} className="border-b border-white/10">
            <h3>
              <button
                type="button"
                id={`faq-question-${index}`}
                aria-expanded={expanded}
                aria-controls={`faq-answer-${index}`}
                onClick={() => setOpen(expanded ? null : index)}
                className="group flex min-h-[78px] w-full items-start justify-between gap-6 py-5 text-left transition-colors duration-200 hover:text-brass"
              >
                <span className="flex items-start gap-5">
                  <span className="mt-1 font-condense text-sm tracking-widest text-brass">{String(index + 1).padStart(2, "0")}</span>
                  <span className={`font-title text-lg font-medium uppercase tracking-wide sm:text-xl ${expanded ? "text-paper-pure" : "text-paper-dim transition-colors group-hover:text-paper-pure"}`}>
                    {item.question}
                  </span>
                </span>
                <Plus size={20} strokeWidth={1.3} aria-hidden="true" className={`mt-1 shrink-0 text-brass transition-transform duration-300 ease-editorial ${expanded ? "rotate-45" : ""}`} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduceMotion ? { height: 0, opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-[72ch] pb-8 text-sm leading-relaxed text-paper-dim sm:pl-10">{item.answer}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
