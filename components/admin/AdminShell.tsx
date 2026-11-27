"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  BarChart3,
  Bell,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  Tags,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { adminPageClass, buttonPrimaryClass, buttonSecondaryClass, inputClass, labelClass } from "./adminStyles";
import { useAdminResource } from "./useAdminResource";

type AdminShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

const navigation = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Complaints", href: "/admin/complaints", icon: MessageSquare, accent: "blue" as const },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Users", href: "/admin/users", icon: UserRound },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Tracking", href: "/admin/tracking", icon: MapPin },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/#settings", icon: Settings },
];

function AdminStatusGate({ heading, message }: { heading: string; message: string }) {
  return (
    <div className={`${adminPageClass} px-5 pb-20 pt-36 sm:px-8 lg:pt-44`}>
      <div className="mx-auto max-w-xl border border-[#E2E2E2] bg-[#FFFFFF] p-8 text-center shadow-sm sm:p-12">
        <span className="mx-auto flex h-12 w-12 items-center justify-center border border-[#B00020] text-[#B00020]">
          <ShieldCheck size={22} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h1 className="mt-7 font-title text-2xl font-medium uppercase tracking-wide text-[#000000]">{heading}</h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-relaxed text-[#555555]">{message}</p>
      </div>
    </div>
  );
}

function AdminLoginGate({ notice }: { notice?: string }) {
  const { login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(notice ?? "");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const profile = await login(email.trim(), password, remember);
      if (!profile.roles?.includes("admin")) {
        await logout();
        setError("This account does not have administrator access. Sign in with an admin account.");
      }
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to sign in. Check your email and password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${adminPageClass} flex min-h-screen items-center justify-center px-5 py-20 sm:px-8`}>
      <div className="w-full max-w-md border border-[#E2E2E2] bg-[#FFFFFF] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:p-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center border border-[#B00020] text-[#B00020]">
          <ShieldCheck size={22} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-center font-title text-2xl font-medium uppercase tracking-wide text-[#000000]">Admin sign in</h1>
        <p className="mt-3 text-center font-sans text-xs leading-relaxed text-[#555555]">
          Use your administrator account to open the Kamora Tech control center.
        </p>

        {notice && !error && <p role="alert" className="mt-5 border border-[#FDE047] bg-[#FEFCE8] px-3 py-2 font-sans text-xs text-[#000000]">{notice}</p>}
        {error && <p role="alert" className="mt-5 border border-[#B00020] bg-[#FFF5F5] px-3 py-2 font-sans text-xs text-[#B00020]">{error}</p>}

        <form onSubmit={submit} className="mt-7 space-y-5">
          <label className="block">
            <span className={labelClass}>Email address</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              className={`${inputClass} mt-2`}
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className={`${inputClass} mt-2`}
              disabled={busy}
            />
          </label>
          <label className="flex items-center gap-2 font-sans text-xs text-[#555555]">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} disabled={busy} />
            Keep me signed in
          </label>
          <button type="submit" disabled={busy} className={`${buttonPrimaryClass} w-full`}>
            {busy ? "Signing in..." : "Sign in to dashboard"}
          </button>
        </form>

        <div className="mt-7 flex flex-col gap-3 border-t border-[#E2E2E2] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/admin/setup/" className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B00020]">
            Create admin account
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/forgot-password/" className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#555555]">
              Forgot password?
            </Link>
            <Link href="/" className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#555555]">
              Back to site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

type SidebarProps = {
  pathname: string;
  hash: string;
  email: string;
  fullName: string;
  loggingOut: boolean;
  onNavigate: () => void;
  onLogout: () => void;
};

function Sidebar({ pathname, hash, email, fullName, loggingOut, onNavigate, onLogout }: SidebarProps) {
  const current = pathname.replace(/\/+$/, "") || "/";
  const isActive = (href: string) => {
    const [target, fragment] = href.split("#");
    const base = target.replace(/\/+$/, "") || "/";
    if (base === "/admin") return current === "/admin" && !fragment;
    if (base === "/dashboard") {
      if (fragment === "settings") return current === "/dashboard" && hash === "#settings";
      return current === "/dashboard" && hash !== "#settings";
    }
    return current === base || current.startsWith(`${base}/`);
  };

  return (
    <div className="admin-sidebar flex h-full flex-col bg-[#B00020] text-[#000000]">
      <div className="border-b border-[#000000]/25 px-5 py-5">
        <p className="font-condense text-2xl tracking-[0.18em] text-[#000000]">KAMORA</p>
        <p className="mt-1 font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-[#000000]/70">Admin console</p>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-[#000000]/60">Workspace</p>
        <ul className="mt-3 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const blueAccent = item.accent === "blue";
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 border px-3 font-sans text-[11px] font-medium uppercase tracking-[0.12em] transition-all duration-200 ${
                    blueAccent
                      ? "border-[#FFFFFF] bg-[#FFFFFF] text-[#1D4ED8] hover:bg-[#EFF6FF]"
                      : active
                        ? "border-[#FFFFFF] bg-[#FFFFFF] text-[#000000] shadow-sm"
                        : "border-transparent text-[#000000] hover:border-[#000000]/30 hover:bg-[#FFFFFF]/25"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[#000000]/25 p-4">
        <p className="truncate font-sans text-[11px] font-semibold text-[#000000]">{fullName}</p>
        <p className="truncate font-sans text-[10px] text-[#000000]/70">{email}</p>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 border border-[#000000] bg-[#000000] font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#FFFFFF] transition-colors hover:bg-[#FFFFFF] hover:text-[#000000] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut size={15} strokeWidth={1.6} aria-hidden="true" />
          {loggingOut ? "Logging out" : "Logout"}
        </button>
      </div>
    </div>
  );
}

export function AdminShell({ title, description, children, actions }: AdminShellProps) {
  const { user, loading, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hash, setHash] = useState("");
  const { data: overview } = useAdminResource<{
    pending_orders?: number;
    open_messages?: number;
    total_complaints?: number;
  }>("/api/v1/admin/dashboard");

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const sync = () => setHash(typeof window === "undefined" ? "" : window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  if (loading) {
    return <AdminStatusGate heading="Verifying session" message="Checking your administrator session against the authentication service." />;
  }

  if (!user || !isAdmin) {
    return (
      <AdminLoginGate
        notice={
          user
            ? `Signed in as ${user.email}, but this account does not have administrator access. Sign in with an admin account.`
            : undefined
        }
      />
    );
  }

  const notificationCount =
    (overview?.pending_orders ?? 0) + (overview?.open_messages ?? 0) + (overview?.total_complaints ?? 0);

  const fullName = user.full_name || user.email;
  const initials = fullName
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    setLoggingOut(true);
    logout()
      .catch(() => undefined)
      .finally(() => {
        setLoggingOut(false);
        router.replace("/login/");
      });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin:search", { detail: term }));
    }
    const base = pathname.replace(/\/+$/, "") || "/admin";
    router.push(`${base}/?q=${encodeURIComponent(term)}`);
  };

  const sidebarProps: SidebarProps = {
    pathname,
    hash,
    email: user.email,
    fullName,
    loggingOut,
    onNavigate: () => setMenuOpen(false),
    onLogout: handleLogout,
  };

  return (
    <div className={`${adminPageClass} admin-theme`}>
      <aside className="admin-sidebar admin-no-print fixed bottom-0 left-0 top-[100px] z-30 hidden w-64 border-r border-[#B00020] lg:top-[114px] lg:block">
        <Sidebar {...sidebarProps} />
      </aside>

      <div className="pt-[100px] lg:pl-64 lg:pt-[114px]">
        <header className="admin-topbar admin-no-print border-b border-[#E2E2E2] bg-[#FFFFFF] px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-[#B00020]">Admin / Control center</p>
              <h1 className="mt-2 font-title text-2xl font-medium uppercase tracking-wide text-[#000000] sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-3xl font-sans text-xs leading-relaxed text-[#555555]">{description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {actions}
              <form onSubmit={submitSearch} role="search" className="relative min-w-[180px] flex-1 sm:min-w-[240px]">
                <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search the control center"
                  aria-label="Search the control center"
                  className="w-full border border-[#D4D4D4] bg-[#FFFFFF] py-2.5 pl-9 pr-3 font-sans text-xs text-[#000000] outline-none transition-colors placeholder:text-[#888888] focus:border-[#B00020]"
                />
              </form>
              <Link
                href="/admin#notifications"
                aria-label={`Notifications, ${notificationCount} pending`}
                className="relative inline-flex h-10 w-10 items-center justify-center border border-[#D4D4D4] text-[#000000] transition-colors hover:border-[#B00020] hover:text-[#B00020]"
              >
                <Bell size={17} strokeWidth={1.7} aria-hidden="true" />
                {notificationCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border border-[#FFFFFF] bg-[#B00020] px-1 font-sans text-[9px] font-bold text-[#FFFFFF]">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-2 border border-[#D4D4D4] bg-[#FAFAFA] py-1.5 pl-1.5 pr-3">
                <span className="flex h-8 w-8 items-center justify-center bg-[#B00020] font-sans text-[10px] font-bold text-[#FFFFFF]">{initials}</span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate font-sans text-[11px] font-semibold text-[#000000]">{fullName}</span>
                  <span className="block truncate font-sans text-[9px] text-[#666666]">Administrator</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open admin navigation"
                aria-expanded={menuOpen}
                className="inline-flex h-10 w-10 items-center justify-center border border-[#D4D4D4] text-[#000000] transition-colors hover:border-[#B00020] hover:text-[#B00020] lg:hidden"
              >
                <Menu size={18} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <main className="admin-shell-main space-y-6 px-5 py-8 sm:px-8 lg:py-10">{children}</main>
      </div>

      {menuOpen && (
        <div className="admin-no-print fixed inset-x-0 bottom-0 top-[100px] z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-[#000000]/60"
          />
          <div className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] border-r border-[#B00020] bg-[#B00020]">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close admin navigation"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center border border-[#000000] text-[#000000]"
            >
              <X size={17} strokeWidth={1.6} aria-hidden="true" />
            </button>
            <Sidebar {...sidebarProps} />
          </div>
        </div>
      )}
    </div>
  );
}
