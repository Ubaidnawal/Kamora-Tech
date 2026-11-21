import {
  Boxes,
  Building2,
  Code2,
  GraduationCap,
  HeartPulse,
  Layers3,
  ShoppingCart,
  UtensilsCrossed,
  UsersRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Product, ProductVisualVariant } from "@/lib/products";

const visualMeta: Record<ProductVisualVariant, { icon: LucideIcon; label: string }> = {
  store: { icon: ShoppingCart, label: "Online store interface" },
  hospital: { icon: HeartPulse, label: "Hospital management dashboard" },
  school: { icon: GraduationCap, label: "School management dashboard" },
  restaurant: { icon: UtensilsCrossed, label: "Restaurant website interface" },
  business: { icon: Building2, label: "Business website interface" },
  portfolio: { icon: Layers3, label: "Portfolio website interface" },
  erp: { icon: Boxes, label: "ERP software dashboard" },
  crm: { icon: UsersRound, label: "CRM software interface" },
  "custom-web": { icon: Code2, label: "Custom website development workspace" },
  "custom-software": { icon: Workflow, label: "Custom software workflow" },
};

function Bar({ width }: { width: string }) {
  return <span className="block h-1 bg-paper/20" style={{ width }} />;
}

function Tile({ className = "" }: { className?: string }) {
  return <span className={`border border-paper/10 bg-paper/[0.06] ${className}`} />;
}

function VisualContent({ variant }: { variant: ProductVisualVariant }) {
  if (variant === "store") {
    return (
      <div className="grid flex-1 grid-cols-3 gap-2">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex flex-col gap-2">
            <Tile className="flex-1 bg-brass/25" />
            <Bar width="80%" />
            <Bar width="45%" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "hospital") {
    return (
      <div className="grid flex-1 grid-cols-[1fr_1.4fr] gap-3">
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((index) => <Bar key={index} width={`${90 - index * 12}%`} />)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((index) => <Tile key={index} className={index === 0 ? "bg-brass/30" : ""} />)}
        </div>
      </div>
    );
  }

  if (variant === "school") {
    return (
      <div className="grid flex-1 grid-cols-3 gap-2">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex flex-col gap-2 border-t border-brass/40 pt-2">
            <Bar width="70%" />
            <Tile className="h-6" />
            <Bar width="90%" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "restaurant" || variant === "business" || variant === "portfolio") {
    return (
      <div className="grid flex-1 grid-cols-2 gap-2">
        <Tile className="bg-brass/25" />
        <div className="flex flex-col justify-center gap-2">
          <Bar width="90%" />
          <Bar width="65%" />
          <Bar width="80%" />
        </div>
      </div>
    );
  }

  if (variant === "erp") {
    return (
      <div className="flex flex-1 items-end gap-1.5 border-b border-paper/20 pb-2">
        {[38, 52, 44, 68, 60, 82, 74, 92].map((height, index) => (
          <span key={index} className="flex-1 bg-brass/50" style={{ height: `${height}%` }} />
        ))}
      </div>
    );
  }

  if (variant === "crm") {
    return (
      <div className="grid flex-1 grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex items-center gap-2 border border-paper/10 p-2">
            <span className="h-5 w-5 shrink-0 bg-brass/40" />
            <div className="flex-1 space-y-1">
              <Bar width="85%" />
              <Bar width="55%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "custom-web") {
    return (
      <div className="flex-1 space-y-2 font-mono text-[8px] text-paper/40">
        {[0, 1, 2, 3, 4].map((index) => (
          <div key={index} className="flex gap-2">
            <span className="text-brass">{String(index + 1).padStart(2, "0")}</span>
            <Bar width={`${92 - index * 11}%`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center gap-2">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex flex-1 items-center gap-2">
          <Tile className="h-8 flex-1 bg-brass/30" />
          {index < 2 && <span className="h-px w-3 bg-paper/30" />}
        </div>
      ))}
    </div>
  );
}

export function ProductVisual({ product, className = "" }: { product: Product; className?: string }) {
  const { icon: Icon, label } = visualMeta[product.visual];

  return (
    <div role="img" aria-label={`${label} for ${product.name}`} className={`relative flex flex-col overflow-hidden bg-background p-5 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-70" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-20%] top-[-25%] h-40 w-40 rounded-full bg-brass/20 blur-3xl" aria-hidden="true" />

      <div className="relative flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brass" />
          <span className="h-1.5 w-1.5 rounded-full bg-paper/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-paper/20" />
        </div>
        <span className="font-condense text-[9px] tracking-[0.22em] text-paper-faint">KAMORA / SOLUTION</span>
      </div>

      <div className="relative mt-4 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-brass/50 text-brass">
          <Icon size={22} strokeWidth={1.4} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <Bar width="88%" />
          <Bar width="55%" />
        </div>
      </div>

      <div className="relative mt-5 flex flex-1 flex-col">
        <VisualContent variant={product.visual} />
      </div>
    </div>
  );
}
