"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { projects } from "@/lib/data";
import { ProjectCard } from "./ProjectCard";

const filters = ["All", "Web", "Software", "E-Commerce", "Automation"] as const;
type Filter = (typeof filters)[number];

export function PortfolioGrid() {
  const [active, setActive] = useState<Filter>("All");
  const reduceMotion = useReducedMotion();
  const visible = active === "All" ? projects : projects.filter((project) => project.category === active);

  return (
    <div>
      <div className="no-scrollbar mb-14 flex items-center gap-2 overflow-x-auto border-b border-white/10 pb-4" role="group" aria-label="Filter project types">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActive(filter)}
            aria-pressed={active === filter}
            className={`min-h-11 shrink-0 border px-5 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200 ${
              active === filter
                ? "border-brass bg-brass text-paper-pure"
                : "border-white/15 text-paper-dim hover:border-brass/60 hover:text-paper-pure"
            }`}
          >
            {filter}
          </button>
        ))}
        <span className="ml-auto hidden shrink-0 font-condense text-sm tracking-widest text-paper-faint sm:block">
          {String(visible.length).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
        </span>
      </div>

      <motion.div layout className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:gap-x-10">
        <AnimatePresence mode="popLayout">
          {visible.map((project, index) => (
            <motion.div
              layout
              key={project.id}
              initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12, scale: 0.98 }}
              transition={{
                duration: reduceMotion ? 0 : 0.4,
                delay: reduceMotion ? 0 : (index % 2) * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
