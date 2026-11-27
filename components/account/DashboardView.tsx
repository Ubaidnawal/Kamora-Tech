"use client";

import {
  ArrowUpRight,
  Grid2X2,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { apiFetch } from "@/lib/api";
import {
  errorMessage,
  formatDate,
  formatMoney,
  humanizeStatus,
  isActiveOrderStatus,
  statusClass,
  type ApiOrder,
} from "@/lib/commerce";
import type { AuthUser } from "@/components/auth/AuthProvider";

type Profile = AuthUser & {
  status?: string;
  created_at?: string;
};

type SidebarLink = { label: string; href: string; icon: LucideIcon; count?: number };

export function DashboardView() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const { count: cartCount } = useCart();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [orderList, account] = await Promise.all([
        apiFetch<ApiOrder[]>("/api/v1/orders"),
        apiFetch<Profile>("/api/v1/auth/me"),
      ]);
      setOrders(Array.isArray(orderList) ? orderList : []);
      setProfile(account);
    } catch (value) {
      setError(errorMessage(value, "We couldn't load your dashboard. Please try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, isAuthenticated, load, reloadKey, user]);

  const counts = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => order.order_status === "pending").length,
    active: orders.filter((order) => isActiveOrderStatus(order.order_status)).length,
    completed: orders.filter((order) => order.order_status === "completed").length,
  }), [orders]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const sidebarLinks: SidebarLink[] = useMemo(
    () => [
      { label: "Overview", href: "/account/", icon: LayoutDashboard },
      { label: "My Orders", href: "/orders/", icon: Package, count: counts.total },
      { label: "Browse Products", href: "/#products", icon: Grid2X2 },
      { label: "Shopping Cart", href: "/cart/", icon: ShoppingCart, count: cartCount },
      { label: "Order Tracking", href: "/track/", icon: Search },
      { label: "My Profile", href: "/account/#profile", icon: UserRound },
      { label: "Settings", href: "/account/#settings", icon: Settings },
    ],
    [cartCount, counts.total],
  );

  const isActiveLink = (href: string) => {
    const target = href.split("#")[0].replace(/\/+$/, "") || "/";
    const current = pathname.replace(/\/+$/, "") || "/";
    return target === current && !href.includes("#");
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/");
    } catch (value) {
      setError(errorMessage(value, "We couldn't log you out. Please try again."));
    } finally {
      setLoggingOut(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-16 text-center">
          <span className="h-10 w-10 animate-spin border border-brass border-t-transparent" aria-hidden="true" />
          <p className="mt-8 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-paper-faint">
            Loading your account
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center border border-brass/40 text-brass">
            <UserRound size={26} strokeWidth={1.3} aria-hidden="true" />
          </span>
          <h2 className="mt-8 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Log in to view your dashboard</h2>
          <p className="body-copy mt-4 text-center">Your orders, project progress and account details are available after sign in.</p>
          <Link href="/login/" className="btn-primary mt-8">Log in</Link>
        </div>
      </div>
    );
  }

  const displayName = profile?.full_name || user.full_name || "there";

  return (
    <div className="grid gap-10 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14">
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <p className="eyebrow">Account menu</p>
        <nav aria-label="Account navigation" className="mt-6">
          <ul className="space-y-1">
            {sidebarLinks.map(({ label, href, icon: Icon, count }) => {
              const active = isActiveLink(href);
              return (
                <li key={label}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-between gap-3 border px-4 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                      active
                        ? "border-brass bg-brass/[0.08] text-brass"
                        : "border-transparent text-paper-dim hover:border-white/15 hover:text-paper-pure"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={15} strokeWidth={1.5} aria-hidden="true" />
                      {label}
                    </span>
                    {typeof count === "number" && count > 0 && <span className="font-condense text-sm">{count}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-8 border-t border-white/10 pt-6">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="flex min-h-11 w-full items-center gap-3 px-4 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-paper-faint transition-colors hover:text-brass disabled:opacity-50"
          >
            <LogOut size={15} strokeWidth={1.5} aria-hidden="true" />
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </aside>

      <div className="min-w-0 space-y-6">
        {error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-4 border border-brass/60 bg-brass/[0.08] px-5 py-4 font-sans text-xs leading-relaxed text-paper-pure">
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="font-semibold uppercase tracking-[0.16em] text-brass">
              Retry
            </button>
          </div>
        )}

        <section className="border border-white/10 bg-surface p-6 sm:p-8">
          <p className="eyebrow">Overview</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="font-title text-3xl font-medium uppercase tracking-wide text-paper-pure">Welcome back, {displayName}.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper-dim">
                A live view of your order requests, delivery progress and account details.
              </p>
            </div>
            <Link href="/track/" className="inline-flex min-h-11 items-center gap-2 border border-white/15 px-4 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim transition-colors hover:border-brass hover:text-brass">
              Track an order
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total orders", value: counts.total },
              { label: "Pending orders", value: counts.pending },
              { label: "Active projects", value: counts.active },
              { label: "Completed orders", value: counts.completed },
            ].map((stat) => (
              <div key={stat.label} className="bg-background p-6">
                <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">{stat.label}</p>
                <p className="mt-4 font-condense text-5xl tracking-wide text-paper-pure">{String(stat.value).padStart(2, "0")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-white/10 bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h3 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Latest orders</h3>
            </div>
            <Link href="/orders/" className="inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
              View all orders
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="py-14 text-center">
              <p className="font-title text-xl uppercase tracking-wide text-paper-pure">No orders yet</p>
              <p className="body-copy mx-auto mt-3 text-center">Your submitted order requests will appear here.</p>
              <Link href="/#products" className="btn-outline mt-7">Browse products</Link>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link href={`/orders/${order.id}/`} className="group flex flex-wrap items-center justify-between gap-4 py-5 transition-colors hover:text-brass">
                    <div className="min-w-0">
                      <p className="font-condense text-xs tracking-[0.2em] text-brass">{order.order_number}</p>
                      <p className="mt-1 truncate font-title text-lg font-medium uppercase tracking-wide text-paper-pure group-hover:text-brass">{order.product_name_snapshot}</p>
                      <p className="mt-1 font-sans text-[11px] text-paper-faint">{formatDate(order.created_at)} · {order.tracking_id}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] ${statusClass(order.order_status)}`}>
                        {humanizeStatus(order.order_status)}
                      </span>
                      <span className="font-condense text-lg text-paper-pure">{formatMoney(order.amount, order.currency)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="profile" className="border border-white/10 bg-surface p-6 sm:p-8">
          <p className="eyebrow">My profile</p>
          <h3 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Account information</h3>
          <dl className="mt-7 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
            {[
              { label: "Full name", value: profile?.full_name || user.full_name },
              { label: "Email", value: profile?.email || user.email },
              { label: "Phone", value: profile?.phone || user.phone || "—" },
              { label: "Business", value: profile?.company_name || "—" },
              { label: "Account status", value: humanizeStatus(profile?.status ?? (profile?.is_active ? "active" : "inactive")) },
              { label: "Roles", value: profile?.roles?.length ? profile.roles.map(humanizeStatus).join(", ") : "Customer" },
            ].map((item) => (
              <div key={item.label} className="bg-background p-5">
                <dt className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">{item.label}</dt>
                <dd className="mt-2 break-words font-sans text-sm text-paper-pure">{item.value || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="settings" className="border border-white/10 bg-surface p-6 sm:p-8">
          <p className="eyebrow">Settings</p>
          <h3 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Communication & billing</h3>
          <p className="body-copy mt-4">
            Order updates are sent to {profile?.email || user.email}. Payment is never recorded on this site; billing terms are confirmed with your fixed-scope proposal after discovery.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/orders/" className="btn-outline">Manage orders</Link>
            <Link href="/contact/" className="btn-primary">Contact support</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
