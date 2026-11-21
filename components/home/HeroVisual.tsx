"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CoreVisual } from "@/components/three/CoreVisual";

const chartBars = [34, 58, 44, 76, 62, 86, 54];

function BrowserPanel() {
  return (
    <div className="hero-panel-glass relative overflow-hidden rounded-[6px] p-[3.5%]">
      <div className="flex items-center gap-[2%] border-b border-paper/10 pb-[3%]">
        <span className="h-[5px] w-[5px] rounded-full bg-brass sm:h-[6px] sm:w-[6px]" />
        <span className="h-[5px] w-[5px] rounded-full bg-paper/25 sm:h-[6px] sm:w-[6px]" />
        <span className="h-[5px] w-[5px] rounded-full bg-paper/15 sm:h-[6px] sm:w-[6px]" />
        <span className="ml-[3%] hidden flex-1 truncate rounded-sm border border-paper/10 bg-black/40 px-[3%] py-[1.5%] font-sans text-[6px] uppercase tracking-[0.12em] text-paper/45 sm:block sm:text-[7px]">
          app / overview
        </span>
      </div>

      <div className="flex gap-[4%] pt-[4%]">
        <div className="w-[24%] space-y-[14%] border-r border-paper/10 pr-[8%]">
          <span className="block h-[3px] w-full bg-brass" />
          <span className="block h-[3px] w-3/4 bg-paper/20" />
          <span className="block h-[3px] w-5/6 bg-paper/15" />
          <span className="block h-[3px] w-2/3 bg-paper/15" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="block h-[5px] w-[42%] bg-paper/35" />
            <span className="block h-[5px] w-[16%] bg-brass/80" />
          </div>
          <span className="mt-[5%] block h-[3px] w-[72%] bg-paper/15" />
          <div className="mt-[6%] grid grid-cols-3 gap-[3%]">
            {[0, 1, 2].map((item) => (
              <div key={item} className="border border-paper/10 bg-paper/[0.03] p-[8%]">
                <span className="block h-[3px] w-1/2 bg-brass/70" />
                <span className="mt-[45%] block h-[3px] w-4/5 bg-paper/20" />
              </div>
            ))}
          </div>
          <div className="mt-[6%] flex h-[26px] items-end gap-[3%] border-b border-paper/10 sm:h-[34px]">
            {chartBars.map((height, index) => (
              <span
                key={index}
                className="flex-1 bg-brass/45"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemsPanel() {
  const rows = [
    { label: "Web", width: "w-[78%]" },
    { label: "Software", width: "w-[62%]" },
    { label: "AI", width: "w-[44%]" },
  ];

  return (
    <div className="hero-panel-glass rounded-[5px] p-[8%]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-sans text-[6px] font-semibold uppercase tracking-[0.16em] text-paper/55 sm:text-[7px]">
          Systems
        </span>
        <span className="h-[5px] w-[5px] bg-brass" />
      </div>
      <div className="mt-[14%] space-y-[10%]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-[6%]">
            <span className="w-[42%] font-sans text-[6px] uppercase tracking-[0.1em] text-paper/45 sm:text-[7px]">
              {row.label}
            </span>
            <span className={`h-[3px] ${row.width} bg-paper/15`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PipelinePanel() {
  return (
    <div className="hero-panel-glass rounded-[5px] p-[8%]">
      <div className="flex items-center justify-between">
        <span className="font-sans text-[6px] font-semibold uppercase tracking-[0.16em] text-paper/55 sm:text-[7px]">
          Pipeline
        </span>
        <span className="font-sans text-[6px] uppercase tracking-[0.12em] text-brass sm:text-[7px]">
          Flow
        </span>
      </div>
      <div className="mt-[12%] grid grid-cols-3 gap-[4%]">
        {["Build", "Test", "Deploy"].map((stage, index) => (
          <div key={stage} className="border border-paper/10 bg-paper/[0.03] px-[6%] py-[8%]">
            <span className={`block h-[3px] ${index === 2 ? "w-full bg-brass" : "w-[65%] bg-paper/25"}`} />
            <span className="mt-[45%] block font-sans text-[5px] uppercase tracking-[0.08em] text-paper/45 sm:text-[6px]">
              {stage}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-[10%] flex items-center gap-[3%]">
        <span className="h-[3px] flex-1 bg-brass/70" />
        <span className="h-[3px] flex-1 bg-brass/70" />
        <span className="h-[3px] flex-1 bg-paper/15" />
      </div>
    </div>
  );
}

export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  const float = (delay: number) =>
    reduceMotion
      ? {}
      : {
          animate: { y: [0, -8, 0] },
          transition: {
            duration: 8,
            delay,
            repeat: Infinity,
            ease: "easeInOut" as const,
          },
        };

  return (
    <div
      className="hero-precision-stage relative mx-auto aspect-[1/1.08] w-full max-w-[540px] sm:aspect-[1/1] lg:aspect-[1.1/1] lg:max-w-[640px]"
      aria-hidden="true"
    >
      <CoreVisual
        variant="hero"
        className="absolute inset-[-8%] h-[116%] w-[116%] opacity-90"
      />

      <div className="hero-precision-veil pointer-events-none absolute inset-0" />

      <motion.div
        {...float(0)}
        className="absolute left-[2%] top-[14%] w-[76%] sm:left-[5%] sm:top-[17%] sm:w-[68%]"
      >
        <BrowserPanel />
      </motion.div>

      <motion.div
        {...float(-3.6)}
        className="absolute bottom-[8%] right-0 w-[48%] sm:bottom-[9%] sm:right-[2%] sm:w-[40%]"
      >
        <PipelinePanel />
      </motion.div>

      <div className="absolute right-[2%] top-[5%] w-[36%] sm:right-[5%] sm:top-[7%] sm:w-[29%]">
        <SystemsPanel />
      </div>
    </div>
  );
}
