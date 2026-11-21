"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronDown, ClipboardList, Mail, Menu, Search, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { contactEmail, navLinks } from "@/lib/data";
import { integrations } from "@/lib/integrations";
import { CoreFallback } from "@/three/CoreFallback";
import { Logo } from "./Logo";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "./SocialIcons";

const normalize = (path: string) => path.replace(/\/+$/, "") || "/";

const servicesMenu = [
  { label: "All services", href: "/services/", note: "Complete offering" },
  { label: "Web development", href: "/website-development/", note: "20 site types" },
  { label: "Software development", href: "/software-development/", note: "Systems & automation" },
];

const socialLinkClass =
  "inline-flex h-8 w-8 items-center justify-center text-paper-dim transition-all duration-200 hover:-translate-y-0.5 hover:text-brass";

function AccountMenu({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const displayName = (user?.full_name || user?.email || "Account").trim();

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setOpen(false);
    } finally {
      setLoggingOut(false);
      close();
      router.push("/");
    }
  };

  const menuItems = [
    { label: "My Account", href: "/dashboard/" },
    { label: "My Orders", href: "/orders/" },
    { label: "Profile", href: "/profile/" },
  ];

  return (
    <div className="relative" ref={container}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={displayName}
        className={`inline-flex min-h-10 items-center gap-2 border border-white/15 font-sans font-semibold uppercase tracking-[0.14em] text-paper-dim transition-colors hover:border-brass hover:text-brass ${
          compact ? "max-w-[72px] px-2 text-[9px] sm:max-w-[110px]" : "max-w-[160px] px-3 text-[10px]"
        }`}
      >
        <span className="truncate">{displayName}</span>
        <ChevronDown size={13} aria-hidden="true" className={`shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-[60] mt-2 w-56 border border-white/10 bg-surface p-2 shadow-2xl shadow-black/60"
          >
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={close}
                className="flex min-h-11 items-center justify-between border-b border-white/[0.07] px-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-paper-dim transition-colors hover:bg-white/[0.04] hover:text-brass"
              >
                {item.label}
                <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-1 flex min-h-11 w-full items-center justify-center px-3 font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-brass transition-colors hover:bg-brass/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out" : "Logout"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const current = normalize(pathname);
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileLoggingOut, setMobileLoggingOut] = useState(false);
  const { count } = useCart();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setScrolled(window.scrollY > 20);
        setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
        frame = 0;
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setServicesOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isActive = (href: string) => normalize(href) === current;
  const servicesActive = ["/services", "/website-development", "/software-development"].includes(current);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    router.push(query ? `/search/?q=${encodeURIComponent(query)}` : "/search/");
    setMenuOpen(false);
  };

  const handleMobileLogout = async () => {
    setMobileLoggingOut(true);
    try {
      await logout();
    } catch {
      setMenuOpen(false);
    } finally {
      setMobileLoggingOut(false);
      setMenuOpen(false);
      router.push("/");
    }
  };

  const desktopLink = (link: { label: string; href: string }) => {
    const active = isActive(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={`relative py-3 font-sans text-[9px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 xl:text-[10px] xl:tracking-[0.17em] ${
          active ? "text-brass" : "text-paper-dim hover:text-paper-pure"
        }`}
      >
        {link.label}
        {active && (
          <motion.span
            layoutId="nav-active"
            className="absolute -bottom-0.5 left-0 h-px w-full bg-brass"
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        )}
      </Link>
    );
  };

  const servicesDropdown = () => (
    <div
      className="relative"
      onMouseEnter={() => setServicesOpen(true)}
      onMouseLeave={() => setServicesOpen(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setServicesOpen(false);
      }}
    >
      <Link
        href="/services/"
        aria-current={isActive("/services/") ? "page" : undefined}
        aria-haspopup="true"
        aria-expanded={servicesOpen}
        className={`flex min-h-11 items-center gap-1.5 py-3 font-sans text-[9px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 xl:text-[10px] xl:tracking-[0.17em] ${
          servicesActive ? "text-brass" : "text-paper-dim hover:text-paper-pure"
        }`}
      >
        Services
        <ChevronDown size={13} aria-hidden="true" className={`transition-transform duration-300 ${servicesOpen ? "rotate-180" : ""}`} />
      </Link>
      <AnimatePresence>
        {servicesOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-full w-[330px] -translate-x-1/2 border border-white/10 bg-surface p-2 shadow-2xl shadow-black/60"
          >
            {servicesMenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between border-b border-white/[0.07] px-4 py-4 last:border-0 hover:bg-white/[0.04]"
              >
                <span>
                  <span className="block font-title text-sm font-medium uppercase tracking-wide text-paper-pure transition-colors group-hover:text-brass">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block font-sans text-[11px] text-paper-faint">{item.note}</span>
                </span>
                <ArrowUpRight size={15} aria-hidden="true" className="text-brass opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="h-px w-full bg-white/[0.06]">
        <div className="h-full bg-brass transition-[width] duration-150 ease-linear" style={{ width: `${progress}%` }} aria-hidden="true" />
      </div>

      <div
        className={`border-b transition-all duration-500 ease-editorial ${
          scrolled || menuOpen
            ? "border-brass/30 bg-background backdrop-blur-xl"
            : "border-brass/20 bg-background"
        }`}
      >
        <div className="border-b border-brass/20">
          <div className="site-container flex h-8 items-center justify-between gap-4">
            <a
              href={`mailto:${contactEmail}`}
              className="group inline-flex min-w-0 items-center gap-2.5 font-sans text-[10px] tracking-[0.08em] text-paper-dim transition-colors duration-200 hover:text-brass"
            >
              <Mail size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brass" />
              <span className="truncate">{contactEmail}</span>
            </a>

            <div className="flex shrink-0 items-center gap-1.5" aria-label="Social links">
              {integrations.whatsappUrl && (
                <a href={integrations.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp" className={socialLinkClass}>
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
              )}
              {integrations.instagramUrl && (
                <a href={integrations.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Kamora Tech on Instagram" className={socialLinkClass}>
                  <InstagramIcon className="h-4 w-4" />
                </a>
              )}
              {integrations.facebookUrl && (
                <a href={integrations.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Kamora Tech on Facebook" className={socialLinkClass}>
                  <FacebookIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="site-container flex h-[68px] items-center justify-between gap-2 sm:gap-4 lg:h-[82px] lg:gap-6"
        >
          <Logo className="min-w-0 shrink" />

          <nav aria-label="Primary navigation" className="hidden flex-1 items-center justify-center gap-3 lg:flex xl:gap-9">
            {navLinks.map((link) => (link.href === "/services/" ? <div key={link.href}>{servicesDropdown()}</div> : desktopLink(link)))}
          </nav>

          <div className="hidden items-center gap-2 border-l border-white/10 pl-3 lg:flex xl:gap-3 xl:pl-5">
            <form
              role="search"
              onSubmit={submitSearch}
              className={`flex h-10 items-center border px-2 transition-colors xl:h-11 xl:px-3 ${
                isActive("/search/") ? "border-brass text-brass" : "border-white/15 text-paper-dim focus-within:border-brass"
              }`}
            >
              <label htmlFor="site-search" className="sr-only">Search site</label>
              <input
                id="site-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search"
                className="w-20 bg-transparent font-sans text-[10px] text-paper-pure outline-none placeholder:text-paper-faint xl:w-28"
              />
              <button type="submit" aria-label="Search" className="ml-1 inline-flex h-7 w-7 items-center justify-center text-brass transition-colors hover:text-paper-pure">
                <Search size={14} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </form>
            <Link
              href="/orders/"
              aria-label="Orders"
              title="Orders"
              aria-current={isActive("/orders/") ? "page" : undefined}
              className={`relative inline-flex h-10 w-10 items-center justify-center border transition-colors duration-200 xl:h-11 xl:w-11 ${
                isActive("/orders/") ? "border-brass text-brass" : "border-white/15 text-paper-dim hover:border-brass hover:text-brass"
              }`}
            >
              <ClipboardList size={16} strokeWidth={1.6} aria-hidden="true" />
            </Link>
            {!authLoading &&
              (isAuthenticated ? (
                <AccountMenu />
              ) : (
                <>
                  <Link
                    href="/login/"
                    aria-current={isActive("/login/") ? "page" : undefined}
                    className={`font-sans text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 xl:text-[10px] ${
                      isActive("/login/") ? "text-brass" : "text-paper-dim hover:text-paper-pure"
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup/"
                    aria-current={isActive("/signup/") ? "page" : undefined}
                    className="btn-primary !min-h-10 !px-3 !py-2 !text-[9px] xl:!min-h-11 xl:!px-5 xl:!text-[10px]"
                  >
                    Sign Up
                  </Link>
                </>
              ))}
            <Link
              href="/cart/"
              aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
              title="Cart"
              aria-current={isActive("/cart/") ? "page" : undefined}
              className={`relative inline-flex h-10 w-10 items-center justify-center border transition-colors duration-200 xl:h-11 xl:w-11 ${
                isActive("/cart/") ? "border-brass text-brass" : "border-white/15 text-paper-dim hover:border-brass hover:text-brass"
              }`}
            >
              <ShoppingBag size={16} strokeWidth={1.6} aria-hidden="true" />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-brass px-1 font-sans text-[10px] font-bold leading-none text-paper-pure">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          </div>

          {!authLoading && isAuthenticated && (
            <div className="shrink-0 lg:hidden">
              <AccountMenu compact />
            </div>
          )}
          <Link
            href="/cart/"
            onClick={() => setMenuOpen(false)}
            aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
            title="Cart"
            aria-current={isActive("/cart/") ? "page" : undefined}
            className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center border transition-colors duration-200 lg:hidden ${
              isActive("/cart/") ? "border-brass text-brass" : "border-white/15 text-paper-dim hover:border-brass hover:text-brass"
            }`}
          >
            <ShoppingBag size={17} strokeWidth={1.6} aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-background bg-brass px-1 font-sans text-[9px] font-bold leading-none text-paper-pure">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-white/15 text-paper-pure transition-colors duration-200 hover:border-brass hover:text-brass lg:hidden"
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-0 bottom-0 top-[101px] overflow-y-auto border-t border-white/10 bg-background lg:hidden"
          >
            <div className="pointer-events-none absolute right-[-10%] top-[8%] h-72 w-72 opacity-40">
              <CoreFallback compact />
            </div>
            <nav aria-label="Mobile navigation" className="site-container relative flex min-h-full flex-col py-10">
              <span className="eyebrow mb-8">Navigation / 01—06</span>
              <ul>
                {navLinks.map((link, index) => (
                  <motion.li
                    key={link.href}
                    initial={reduceMotion ? false : { opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: reduceMotion ? 0 : 0.04 + index * 0.045, duration: 0.35 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={`flex min-h-[66px] items-center justify-between gap-4 border-b border-white/10 py-2 font-display text-[clamp(2rem,10vw,3.2rem)] uppercase leading-none tracking-tight transition-colors duration-200 ${
                        isActive(link.href) ? "text-brass" : "text-paper-pure hover:text-brass"
                      }`}
                    >
                      <span className="flex items-baseline gap-4">
                        <span className="font-condense text-[11px] tracking-widest text-paper-faint">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {link.label}
                      </span>
                      <ArrowUpRight size={20} strokeWidth={1.3} aria-hidden="true" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-auto pt-12">
                <form role="search" onSubmit={submitSearch} className="mb-4 flex h-12 items-center border border-white/15 px-3 focus-within:border-brass">
                  <label htmlFor="mobile-site-search" className="sr-only">Search site</label>
                  <input
                    id="mobile-site-search"
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search services, products, pages"
                    className="min-w-0 flex-1 bg-transparent font-sans text-xs text-paper-pure outline-none placeholder:text-paper-faint"
                  />
                  <button type="submit" aria-label="Search" className="ml-2 inline-flex h-8 w-8 items-center justify-center text-brass">
                    <Search size={16} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </form>
                {!authLoading && isAuthenticated ? (
                  <div>
                    <p className="eyebrow mb-4">Signed in as {user?.full_name || user?.email}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Link href="/dashboard/" onClick={() => setMenuOpen(false)} className="btn-outline !min-h-12 !px-4 !py-3 !text-[10px]">
                        My Account
                      </Link>
                      <Link href="/orders/" onClick={() => setMenuOpen(false)} className="btn-outline !min-h-12 !px-4 !py-3 !text-[10px]">
                        My Orders
                      </Link>
                      <Link href="/profile/" onClick={() => setMenuOpen(false)} className="btn-outline !min-h-12 !px-4 !py-3 !text-[10px]">
                        Profile
                      </Link>
                      <button
                        type="button"
                        onClick={handleMobileLogout}
                        disabled={mobileLoggingOut}
                        className="btn-primary !min-h-12 !px-4 !py-3 !text-[10px] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {mobileLoggingOut ? "Logging out" : "Logout"}
                      </button>
                    </div>
                  </div>
                ) : (
                  !authLoading && (
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/login/"
                        onClick={() => setMenuOpen(false)}
                        aria-current={isActive("/login/") ? "page" : undefined}
                        className="btn-outline !min-h-12 !px-4 !py-3 !text-[10px]"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup/"
                        onClick={() => setMenuOpen(false)}
                        aria-current={isActive("/signup/") ? "page" : undefined}
                        className="btn-primary !min-h-12 !px-4 !py-3 !text-[10px]"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )
                )}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Link
                    href="/orders/"
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive("/orders/") ? "page" : undefined}
                    className="flex min-h-12 items-center justify-center gap-2 border border-white/15 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim transition-colors hover:border-brass hover:text-brass"
                  >
                    <ClipboardList size={15} strokeWidth={1.6} aria-hidden="true" />
                    Orders
                  </Link>
                  <Link
                    href="/cart/"
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive("/cart/") ? "page" : undefined}
                    aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
                    className="relative flex min-h-12 items-center justify-center gap-2 border border-brass font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass"
                  >
                    <ShoppingBag size={15} strokeWidth={1.6} aria-hidden="true" />
                    Cart
                    {count > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brass px-1 font-sans text-[10px] font-bold text-paper-pure">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>
                </div>
                <Link href="/contact/" onClick={() => setMenuOpen(false)} className="btn-primary mt-3 w-full">
                  Start a project
                </Link>
                <a href={`mailto:${contactEmail}`} className="mt-5 block text-center font-sans text-sm text-paper-dim">
                  {contactEmail}
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
