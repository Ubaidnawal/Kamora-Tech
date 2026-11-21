import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

type SectionHeadingProps = {
  number?: string;
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  light?: boolean;
};

export function SectionHeading({
  number,
  eyebrow,
  title,
  description,
  align = "left",
  light = false,
}: SectionHeadingProps) {
  return (
    <Reveal className={`${align === "center" ? "mx-auto max-w-3xl text-center" : "relative max-w-4xl"}`}>
      {number && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -top-12 left-0 hidden select-none font-display text-[5rem] leading-none tracking-[-0.02em] lg:block lg:text-[6rem] ${
            light ? "text-ink/[0.045]" : "text-white/[0.025]"
          }`}
        >
          {number}
        </span>
      )}
      <div className={`relative mb-7 flex items-center gap-4 ${align === "center" ? "justify-center" : ""}`}>
        <span className={`h-px w-12 ${light ? "bg-brass-deep" : "bg-brass"}`} />
        <span className={`eyebrow ${light ? "!text-brass-deep" : ""}`}>
          {number ? `${number} / ` : ""}
          {eyebrow}
        </span>
      </div>
      <h2
        className={`section-title relative text-balance ${
          light ? "text-ink" : "text-paper-pure"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p className={`body-copy relative mt-6 ${align === "center" ? "mx-auto" : ""} ${light ? "!text-ink/60" : ""}`}>
          {description}
        </p>
      )}
    </Reveal>
  );
}
