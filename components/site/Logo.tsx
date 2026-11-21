import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Kamora Tech — home"
      className={`group inline-flex items-center gap-2.5 rounded-sm ${className}`}
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        fill="none"
        aria-hidden="true"
        className="shrink-0 transition-transform duration-500 ease-editorial group-hover:rotate-90"
      >
        <rect x="1" y="1" width="32" height="32" stroke="currentColor" strokeOpacity="0.42" />
        <path
          d="M10.5 8V26M10.5 17.4L23.5 8.5M10.5 17.4L23.5 25.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="23.5" cy="8.5" r="1.7" fill="#8B0D1A" />
      </svg>
      <span className="block leading-none">
        <span className="block font-display text-[21px] tracking-[0.03em] text-paper-pure sm:text-[23px]">
          KAMORA
        </span>
        <span className="mt-0.5 block font-sans text-[8px] font-semibold tracking-[0.42em] text-brass">
          TECH
        </span>
      </span>
    </Link>
  );
}
