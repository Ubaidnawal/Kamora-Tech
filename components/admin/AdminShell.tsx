"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { buttonSecondaryClass } from "./adminStyles";

type AdminShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

const navigation = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Tracking", href: "/admin/tracking", icon: MapPin },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function AdminGate({ heading, message }: { heading: string; message: string }) {
  return (
    <div className="min-h-screen bg-black px-5 pb-20 pt-36 sm:px-8 lg:pt-44">
      <div className="mx-auto max-w-xl border border-burgundy/40 bg-black p-8 text-center sm:p-12">
        <span className="mx-auto flex h-12 w-12 items-center justify-center border border-burgundy text-burgundy">
          <ShieldCheck size={22} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h1 className="mt-7 font-title text-2xl font-medium uppercase tracking-wide text-cream">{heading}</h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-sm leading-relaxed text-cream/60">{message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/login/" className="inline-flex min-h-10 items-center justify-center border border-burgundy bg-burgundy px-5 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-cream">
            Go to login
          </Link>
          <Link href="/" className={buttonSecondaryClass}>
            Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}

type SidebarProps = {
  pathname: string;
  email: string;
  loggingOut: boolean;
  onNavigate: () => void;
  onLogout: () => void;
};

function Sidebar({ pathname, email, loggingOut, onNavigate, onLogout }: SidebarProps) {
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="flex h-full flex-col bg-black">
      <div className="border-b border-burgundy/25 px-5 py-5">
        <p className="font-condense text-2xl tracking-[0.18em] text-cream">KAMORA</p>
        <p className="mt-1 font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-burgundy">Admin console</p>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-3 font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-cream/35">Workspace</p>
        <ul className="mt-3 space-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 border px-3 font-sans text-[11px] font-medium uppercase tracking-[0.12em] transition-colors duration-200 ${
                    active
                      ? "border-burgundy bg-burgundy/12 text-cream"
                      : "border-transparent text-cream/60 hover:border-cream/15 hover:text-cream"
                  }`}
                >
                  <Icon size={16} strokeWidth={1.6} aria-hidden="true" className={active ? "text-burgundy" : "text-cream/50"} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-burgundy/25 p-4">
        <p className="truncate font-sans text-[11px] text-cream/70">{email}</p>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 border border-cream/20 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/70 transition-colors hover:border-burgundy hover:text-burgundy disabled:cursor-not-allowed disabled:opacity-50"
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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return <AdminGate heading="Verifying session" message="Checking your administrator session against the authentication service." />;
  }

  if (!user || !isAdmin) {
    return (
      <AdminGate
        heading="Administrator access required"
        message="This control center is restricted to accounts with the admin role. Sign in with an administrator account to continue."
      />
    );
  }

  const handleLogout = () => {
    setLoggingOut(true);
    logout()
      .catch(() => undefined)
      .finally(() => {
        setLoggingOut(false);
        router.replace("/login/");
      });
  };

  const sidebarProps: SidebarProps = {
    pathname,
    email: user.email,
    loggingOut,
    onNavigate: () => setMenuOpen(false),
    onLogout: handleLogout,
  };

  return (
    <div className="min-h-screen bg-black text-cream">
      <aside className="fixed bottom-0 left-0 top-[100px] z-30 hidden w-64 border-r border-burgundy/30 lg:top-[114px] lg:block">
        <Sidebar {...sidebarProps} />
      </aside>

      <div className="pt-[100px] lg:pl-64 lg:pt-[114px]">
        <header className="border-b border-burgundy/25 bg-black px-5 py-6 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-burgundy">Admin / Control center</p>
              <h1 className="mt-2 font-title text-2xl font-medium uppercase tracking-wide text-cream sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-3xl font-sans text-xs leading-relaxed text-cream/55">{description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open admin navigation"
                aria-expanded={menuOpen}
                className="inline-flex h-10 w-10 items-center justify-center border border-cream/20 text-cream/70 transition-colors hover:border-burgundy hover:text-burgundy lg:hidden"
              >
                <Menu size={18} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6 px-5 py-8 sm:px-8 lg:py-10">{children}</div>
      </div>

      {menuOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[100px] z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-black/80"
          />
          <div className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] border-r border-burgundy/40 bg-black">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close admin navigation"
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center border border-cream/20 text-cream/70"
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
