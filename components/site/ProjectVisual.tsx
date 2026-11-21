import type { Project } from "@/lib/data";

function BrowserVariant() {
  return (
    <div className="absolute inset-[12%] border border-white/15 bg-[#0B0B0B] shadow-2xl">
      <div className="flex h-5 items-center gap-1 border-b border-white/10 px-2">
        <span className="h-1 w-1 rounded-full bg-brass" />
        <span className="h-1 w-1 rounded-full bg-white/20" />
        <span className="h-1 w-1 rounded-full bg-white/20" />
      </div>
      <div className="flex h-[calc(100%-1.25rem)]">
        <div className="flex w-1/2 flex-col justify-center gap-2 p-4">
          <span className="font-display text-[clamp(1.4rem,4vw,2.6rem)] uppercase leading-[0.82] text-paper-pure">
            Form
          </span>
          <span className="font-display text-[clamp(1.4rem,4vw,2.6rem)] uppercase leading-[0.82] text-outline-brass">
            Follows
          </span>
          <span className="mt-1 h-1 w-10 bg-brass" />
          <span className="mt-1 h-1 w-16 bg-white/15" />
        </div>
        <div className="flex w-1/2 items-center justify-center border-l border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-3">
          <div className="relative h-full w-full">
            <div className="absolute left-[22%] top-[12%] h-[76%] w-[56%] border border-brass/40" />
            <div className="absolute left-[34%] top-[26%] h-[48%] w-[32%] bg-brass/15" />
            <div className="absolute bottom-[10%] left-[10%] h-1 w-[30%] bg-white/15" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardVariant() {
  return (
    <div className="absolute inset-[10%] flex border border-white/15 bg-[#0B0B0B] shadow-2xl">
      <div className="flex w-[22%] flex-col gap-2 border-r border-white/10 p-2.5">
        <span className="mb-2 h-2 w-2 bg-brass" />
        {[70, 50, 62, 44, 58].map((w, i) => (
          <span key={i} className="h-[3px] bg-white/15" style={{ width: `${w}%` }} />
        ))}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 border border-white/10 p-2">
              <span className="block h-1 w-2/3 bg-white/15" />
              <span className="mt-2 block h-3 w-1/2 bg-brass/50" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-1 items-end gap-1.5 border-b border-white/10 pb-1">
          {[24, 38, 30, 52, 44, 66, 58, 78, 62, 88].map((h, i) => (
            <span key={i} className="flex-1 bg-brass/40" style={{ height: `${h}%` }} />
          ))}
        </div>
        <svg viewBox="0 0 200 34" className="mt-2 h-8 w-full" preserveAspectRatio="none">
          <path
            d="M0 28 L22 22 L44 25 L66 14 L88 18 L110 9 L132 13 L154 5 L176 10 L200 3"
            fill="none"
            stroke="#8B0D1A"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
}

function StoreVariant() {
  return (
    <div className="absolute inset-[10%] border border-white/15 bg-[#0B0B0B] p-3 shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-sm tracking-wide text-paper-pure">ATELIER</span>
        <span className="h-1 w-12 bg-brass/50" />
      </div>
      <div className="grid h-[calc(100%-2rem)] grid-cols-3 gap-2">
        {[
          "from-white/[0.09] to-transparent",
          "from-brass/20 to-transparent",
          "from-white/[0.05] to-transparent",
        ].map((gradient, i) => (
          <div key={i} className="flex flex-col border border-white/10">
            <div className={`flex-1 bg-gradient-to-br ${gradient}`}>
              <div className="mx-auto mt-[18%] h-[55%] w-[55%] border border-white/15" />
            </div>
            <div className="space-y-1.5 p-2">
              <span className="block h-1 w-3/4 bg-white/20" />
              <span className="block h-1 w-1/3 bg-brass/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MobileVariant() {
  return (
    <div className="absolute left-1/2 top-[8%] h-[84%] w-[46%] -translate-x-1/2 border-[5px] border-[#8B0D1A] bg-[#0B0B0B] shadow-2xl">
      <div className="mx-auto mt-1.5 h-1 w-6 rounded-full bg-white/15" />
      <div className="px-3 pt-4">
        <span className="font-display text-base tracking-wide text-paper-pure">FIELDNOTES</span>
        <div className="mt-1 h-1 w-2/3 bg-brass/50" />
      </div>
      <div className="mt-4 space-y-2 px-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 border border-white/10 p-2">
            <span className="h-6 w-6 shrink-0 bg-brass/20" />
            <span className="flex-1 space-y-1">
              <span className="block h-1 w-3/4 bg-white/20" />
              <span className="block h-1 w-1/2 bg-white/10" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeVariant() {
  return (
    <div className="absolute inset-[11%] border border-white/15 bg-[#0B0B0B] shadow-2xl">
      <div className="flex h-5 items-center justify-between border-b border-white/10 px-2.5">
        <span className="h-1 w-16 bg-white/15" />
        <span className="h-1 w-8 bg-brass/40" />
      </div>
      <div className="p-3">
        {[
          [40, 30, 18],
          [20, 52, 26],
          [32, 24, 44],
          [16, 38, 22],
          [48, 28, 14],
          [24, 44, 32],
          [36, 20, 48],
        ].map((widths, i) => (
          <div key={i} className="mb-2 flex items-center gap-1.5">
            <span className="w-3 font-sans text-[6px] text-paper/20">{i + 1}</span>
            {widths.map((w, j) => (
              <span
                key={j}
                className={`h-[3px] ${j === 1 ? "bg-brass/60" : "bg-white/15"}`}
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsVariant() {
  return (
    <div className="absolute inset-[10%] border border-white/15 bg-[#0B0B0B] p-3 shadow-2xl">
      <div className="flex items-center justify-between">
        <span className="h-1.5 w-16 bg-white/20" />
        <span className="h-1.5 w-8 bg-brass/60" />
      </div>
      <div className="mt-3 grid h-[calc(100%-5rem)] grid-cols-2 gap-2">
        <div className="border border-white/10 p-2">
          <svg viewBox="0 0 100 50" className="h-full w-full" preserveAspectRatio="none">
            <path d="M0 42 L18 34 L36 38 L54 22 L72 27 L90 12 L100 16" fill="none" stroke="#8B0D1A" strokeWidth="1.6" />
            <path d="M0 42 L18 34 L36 38 L54 22 L72 27 L90 12 L100 16 L100 50 L0 50 Z" fill="rgba(139,13,26,0.08)" />
          </svg>
        </div>
        <div className="grid grid-rows-2 gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="border border-white/10 p-2">
              <span className="block h-1 w-2/3 bg-white/15" />
              <span className="mt-2 block h-3 w-1/2 bg-brass/40" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <span key={i} className="h-2 flex-1 bg-white/[0.07]" />
        ))}
      </div>
    </div>
  );
}

const variants: Record<Project["variant"], () => JSX.Element> = {
  browser: BrowserVariant,
  dashboard: DashboardVariant,
  store: StoreVariant,
  mobile: MobileVariant,
  code: CodeVariant,
  analytics: AnalyticsVariant,
};

export function ProjectVisual({ variant }: { variant: Project["variant"] }) {
  const Variant = variants[variant];
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0B0B0B]" aria-hidden="true">
      <div className="absolute inset-0 bg-grid-fine opacity-60" />
      <div className="absolute left-1/2 top-1/2 h-[70%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass/[0.07] blur-[60px]" />
      <Variant />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-deep/45 to-transparent" />
    </div>
  );
}
