import { ArrowUpRight, Mail, MapPin, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { contactEmail, navLinks, serviceCategories } from "@/lib/data";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-brass/[0.05] blur-[120px]" aria-hidden="true" />

      <div className="site-container relative pt-16 md:pt-20 lg:pt-24">
        <div className="grid gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 md:grid-cols-4 md:gap-8 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-10">
          <div>
            <Logo />
            <p className="mt-6 max-w-xs text-[13px] leading-relaxed text-paper-dim">
              An independent digital studio building websites, software and automation for businesses with ambition.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 border border-brass/25 bg-brass/[0.04] px-4 py-3">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brass opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brass" />
              </span>
              <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-brass">
                Available for new projects
              </span>
            </div>
          </div>

          <div>
            <h2 className="eyebrow">Navigate</h2>
            <ul className="mt-7 space-y-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="group inline-flex items-center gap-2 text-[13px] text-paper-dim transition-colors hover:text-brass">
                    <span className="h-px w-0 bg-brass transition-all duration-300 group-hover:w-4" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="eyebrow">Capabilities</h2>
            <ul className="mt-7 space-y-4">
              {serviceCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={
                      category.id === "website"
                        ? "/website-development/"
                        : category.id === "software"
                          ? "/software-development/"
                          : "/services/"
                    }
                    className="text-[13px] text-paper-dim transition-colors hover:text-brass"
                  >
                    {category.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/services/#other" className="text-[13px] text-paper-dim transition-colors hover:text-brass">
                  E-Commerce & Care
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="eyebrow">Contact</h2>
            <ul className="mt-7 space-y-5 text-[13px] text-paper-dim">
              <li>
                <a href={`mailto:${contactEmail}`} className="group inline-flex items-start gap-3 transition-colors hover:text-brass">
                  <Mail size={16} strokeWidth={1.4} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />
                  {contactEmail}
                </a>
              </li>
              <li>
                <Link href="/contact/" className="group inline-flex items-start gap-3 transition-colors hover:text-brass">
                  <MessageSquareText size={16} strokeWidth={1.4} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />
                  Start a conversation
                </Link>
              </li>
              <li className="inline-flex items-start gap-3">
                <MapPin size={16} strokeWidth={1.4} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />
                Remote-first · working worldwide
              </li>
            </ul>
          </div>
        </div>

        <div className="relative overflow-hidden py-8">
          <p className="whitespace-nowrap font-display text-[clamp(2.5rem,8vw,6rem)] uppercase leading-[1.05] tracking-[-0.02em] text-white/[0.045]">
            Kamora Tech — Digital Solutions
          </p>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-7 text-[11px] text-paper-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kamora Tech. All rights reserved.</p>
          <Link href="/contact/" className="group inline-flex items-center gap-2 font-semibold uppercase tracking-[0.16em] text-brass transition-colors hover:text-paper-pure">
            Build with us
            <ArrowUpRight size={14} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
