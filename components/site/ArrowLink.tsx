import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type ArrowLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline" | "text";
  className?: string;
  external?: boolean;
};

const isExternalHref = (href: string) => /^(https?:)?\/\//i.test(href);

export function ArrowLink({
  href,
  children,
  variant = "solid",
  className = "",
  external = false,
}: ArrowLinkProps) {
  const base = "group inline-flex items-center justify-center";

  const styles =
    variant === "solid"
      ? "btn-primary"
      : variant === "outline"
        ? "btn-outline"
        : "min-h-12 gap-2 border-b border-brass/60 pb-1 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-brass transition-colors hover:border-brass hover:text-paper-pure";

  const icon = (
    <ArrowUpRight
      size={16}
      strokeWidth={1.8}
      aria-hidden="true"
      className="relative z-10 transition-transform duration-200 ease-editorial group-hover:translate-x-1 group-hover:-translate-y-1"
    />
  );

  const isMailOrTel = href.startsWith("mailto:") || href.startsWith("tel:");
  const opensInNewTab = !isMailOrTel && (external || isExternalHref(href));

  if (external || isMailOrTel) {
    return (
      <a
        href={href}
        className={`${base} ${styles} ${className}`}
        {...(opensInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <span className="relative z-10">{children}</span>
        {icon}
      </a>
    );
  }

  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      <span className="relative z-10">{children}</span>
      {icon}
    </Link>
  );
}
