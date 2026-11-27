"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  AdminBanner,
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  DateText,
  Money,
  RatingBadge,
  StatCard,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { AdminShell } from "@/components/admin/AdminShell";
import { buttonPrimaryClass, buttonSecondaryClass, cardClass, inputClass, labelClass, noteClass } from "@/components/admin/adminStyles";
import type { AdminDashboard, AdminReview, AdminComplaintSummary } from "@/components/admin/types";
import { useAdminResource } from "@/components/admin/useAdminResource";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Package,
  Search,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const shortcuts = [
  { label: "Orders", href: "/admin/orders", description: "Fulfilment, payment and delivery details", icon: ShoppingCart },
  { label: "Reviews", href: "/admin/reviews", description: "Approve, edit and moderate customer reviews", icon: Star },
  { label: "Complaints", href: "/admin/complaints", description: "Track cases and record internal notes", icon: MessageSquare },
  { label: "Customers", href: "/admin/customers", description: "Customer profiles and linked records", icon: Users },
  { label: "Products", href: "/admin/products", description: "Catalog, badges and image controls", icon: Package },
  { label: "Reports", href: "/admin/reports", description: "Commerce report and monthly orders", icon: ClipboardList },
];

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAdminResource<AdminDashboard>("/api/v1/admin/dashboard");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = new URLSearchParams(window.location.search).get("q") ?? "";
    setSearch(value);
    const onSearch = (event: Event) => setSearch((event as CustomEvent<string>).detail ?? "");
    window.addEventListener("admin:search", onSearch);
    return () => window.removeEventListener("admin:search", onSearch);
  }, []);

  const recentOrders = asArray(data?.recent_orders);
  const recentComplaints = asArray<AdminComplaintSummary>(data?.recent_complaints);
  const recentReviews = asArray<AdminReview>(data?.recent_reviews);
  const recentRegistrations = asArray(data?.recent_registrations);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return { orders: recentOrders, complaints: recentComplaints, reviews: recentReviews, registrations: recentRegistrations };
    const matches = (values: (string | null | undefined)[]) => values.some((value) => value?.toLowerCase().includes(needle));
    return {
      orders: recentOrders.filter((order) =>
        matches([order.order_number, order.tracking_id, order.customer_name, order.customer_email, order.product_name_snapshot]),
      ),
      complaints: recentComplaints.filter((complaint) =>
        matches([complaint.tracking_id, complaint.subject, complaint.full_name, complaint.email, complaint.status, complaint.category]),
      ),
      reviews: recentReviews.filter((review) => matches([review.product_name, review.user_name, review.user_email, review.review_text])),
      registrations: recentRegistrations.filter((registration) => matches([registration.full_name, registration.email, registration.phone])),
    };
  }, [recentComplaints, recentOrders, recentRegistrations, recentReviews, search]);

  const notificationCount = (data?.pending_orders ?? 0) + (data?.open_messages ?? 0) + (data?.total_complaints ?? 0);

  const statCards: { label: string; value: ReactNode; note?: string; accent?: "red" | "green" | "yellow" | "blue" }[] = data
    ? [
        { label: "Total orders", value: data.total_orders, accent: "red" },
        { label: "Pending orders", value: data.pending_orders, note: "Awaiting confirmation", accent: "yellow" },
        { label: "Paid orders", value: data.paid_orders, note: "Payment marked paid", accent: "green" },
        { label: "Processing orders", value: data.processing_orders ?? data.in_progress_orders, accent: "blue" },
        { label: "Completed orders", value: data.completed_orders, accent: "green" },
        { label: "Cancelled orders", value: data.cancelled_orders ?? 0, accent: "red" },
        { label: "Products", value: data.total_products, note: "Non-deleted catalog records" },
        { label: "Customers", value: data.total_users, note: "Registered accounts" },
        { label: "Reviews", value: data.total_reviews ?? 0, accent: "yellow" },
        { label: "Complaints", value: data.total_complaints ?? 0, accent: "blue" },
        { label: "Open messages", value: data.open_messages, accent: "yellow" },
        { label: "Paid revenue", value: <Money value={data.revenue_paid} />, note: "Sum of paid payments", accent: "green" },
      ]
    : [];

  return (
    <AdminShell
      title="Dashboard"
      description="Live totals and recent activity from the admin dashboard endpoint. All figures come from the database."
    >
      <AdminPanel
        title="Operations overview"
        description={user ? `Signed in as ${user.email}` : "Administrator session active."}
        action={
          <button type="button" onClick={reload} className={buttonSecondaryClass}>
            Refresh data
          </button>
        }
      >
        {loading ? (
          <AdminLoadingBlock label="Loading dashboard" />
        ) : error ? (
          <AdminErrorBlock message={error} onRetry={reload} />
        ) : data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.label} label={card.label} value={card.value} note={card.note} accent={card.accent} />
            ))}
          </div>
        ) : (
          <AdminLoadingBlock label="Waiting for dashboard data" />
        )}
        <p className={`${noteClass} mt-5`}>All values above are returned by GET /api/v1/admin/dashboard.</p>
      </AdminPanel>

      <AdminPanel title="Global search" description="Filter the recent activity below by order, tracking ID, customer, complaint or review text.">
        <label className="block">
          <span className={labelClass}>Search recent activity</span>
          <div className="relative mt-2">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try an order number, tracking ID, email or review keyword"
              className={`${inputClass} pl-10`}
            />
          </div>
        </label>
        {search.trim() && (
          <p className={`${noteClass} mt-3`}>
            Matching: {filtered.orders.length} orders · {filtered.complaints.length} complaints · {filtered.reviews.length} reviews · {filtered.registrations.length} registrations
          </p>
        )}
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-3">
        <AdminPanel title="Recent orders" description="Latest orders returned by the dashboard endpoint.">
          {filtered.orders.length ? (
            <ul className="space-y-3">
              {filtered.orders.map((order) => (
                <li key={order.id} className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-[#000000]">{order.order_number}</p>
                      <p className="mt-1 font-sans text-[10px] text-[#666666]">
                        {order.customer_name} · {order.product_name_snapshot}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge value={order.order_status} />
                      <StatusBadge value={order.payment_status} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-sans text-[11px] text-[#555555]">
                    <span><Money value={order.amount} currency={order.currency} /></span>
                    <span><DateText value={order.created_at} withTime /></span>
                  </div>
                  <Link href="/admin/orders" className="mt-3 inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B00020]">
                    Manage <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmptyBlock title="No recent orders" description="No orders match the current search." />
          )}
        </AdminPanel>

        <AdminPanel title="Recent complaints" description="Latest complaint cases returned by the dashboard endpoint.">
          {filtered.complaints.length ? (
            <ul className="space-y-3">
              {filtered.complaints.map((complaint) => (
                <li key={complaint.id} className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-[#000000]">{complaint.subject ?? complaint.tracking_id ?? complaint.id}</p>
                      <p className="mt-1 font-sans text-[10px] text-[#666666]">
                        {complaint.full_name ?? "Customer"} · {complaint.tracking_id ?? complaint.id}
                      </p>
                    </div>
                    <StatusBadge value={complaint.status ?? "new"} tone="info" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-sans text-[11px] text-[#555555]">
                    <span>{complaint.category ?? "Uncategorised"} · {complaint.priority ?? "normal"}</span>
                    <span><DateText value={complaint.created_at} /></span>
                  </div>
                  <Link href="/admin/complaints" className="mt-3 inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1D4ED8]">
                    Review case <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmptyBlock title="No recent complaints" description="No complaints match the current search." />
          )}
        </AdminPanel>

        <AdminPanel title="Recent reviews" description="Latest customer reviews returned by the dashboard endpoint.">
          {filtered.reviews.length ? (
            <ul className="space-y-3">
              {filtered.reviews.map((review) => (
                <li key={review.id} className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-[#000000]">{review.product_name ?? review.product_slug ?? "Product"}</p>
                      <p className="mt-1 font-sans text-[10px] text-[#666666]">{review.user_name ?? "Customer"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <RatingBadge value={review.rating} />
                      <StatusBadge value={review.is_approved ? "approved" : "pending"} />
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 font-sans text-xs leading-relaxed text-[#444444]">{review.review_text}</p>
                  <p className="mt-2 font-sans text-[10px] text-[#666666]"><DateText value={review.created_at} withTime /></p>
                  <Link href="/admin/reviews" className="mt-3 inline-flex items-center gap-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B00020]">
                    Moderate <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmptyBlock title="No recent reviews" description="No reviews match the current search." />
          )}
        </AdminPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Recent registrations" description="Newest accounts returned with the dashboard data.">
          {filtered.registrations.length ? (
            <ul className="space-y-3">
              {filtered.registrations.map((registration) => (
                <li key={registration.id} className={cardClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-[#000000]">{registration.full_name}</p>
                      <p className="mt-1 break-all font-sans text-[10px] text-[#666666]">{registration.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <StatusBadge value={registration.status} />
                      {registration.roles.map((role) => <StatusBadge key={role} value={role} />)}
                    </div>
                  </div>
                  <p className="mt-3 font-sans text-[11px] text-[#666666]">Joined <DateText value={registration.created_at} withTime /></p>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmptyBlock title="No recent registrations" description="No accounts match the current search." />
          )}
        </AdminPanel>

        <AdminPanel
          id="notifications"
          title="Notifications"
          description="Items that need attention, calculated from live dashboard totals."
          action={<Bell size={18} aria-hidden="true" className="text-[#B00020]" />}
        >
          {loading ? (
            <AdminLoadingBlock label="Loading notifications" />
          ) : error ? (
            <AdminErrorBlock message={error} onRetry={reload} />
          ) : (
            <div className="space-y-3">
              <Link href="/admin/orders" className={`${cardClass} flex items-center justify-between gap-4 transition-colors hover:border-[#B00020]`}>
                <span className="flex items-center gap-3 font-sans text-sm text-[#000000]"><AlertTriangle size={17} className="text-[#CA8A04]" aria-hidden="true" />Pending orders</span>
                <span className="font-condense text-xl text-[#B00020]">{data?.pending_orders ?? 0}</span>
              </Link>
              <Link href="/admin/messages" className={`${cardClass} flex items-center justify-between gap-4 transition-colors hover:border-[#B00020]`}>
                <span className="flex items-center gap-3 font-sans text-sm text-[#000000]"><MessageSquare size={17} className="text-[#CA8A04]" aria-hidden="true" />Open messages</span>
                <span className="font-condense text-xl text-[#B00020]">{data?.open_messages ?? 0}</span>
              </Link>
              <Link href="/admin/complaints" className={`${cardClass} flex items-center justify-between gap-4 transition-colors hover:border-[#1D4ED8]`}>
                <span className="flex items-center gap-3 font-sans text-sm text-[#000000]"><AlertTriangle size={17} className="text-[#1D4ED8]" aria-hidden="true" />Complaints on record</span>
                <span className="font-condense text-xl text-[#1D4ED8]">{data?.total_complaints ?? 0}</span>
              </Link>
              <Link href="/admin/reviews" className={`${cardClass} flex items-center justify-between gap-4 transition-colors hover:border-[#B00020]`}>
                <span className="flex items-center gap-3 font-sans text-sm text-[#000000]"><Star size={17} className="text-[#CA8A04]" aria-hidden="true" />Reviews to moderate</span>
                <span className="font-condense text-xl text-[#B00020]">{data?.total_reviews ?? 0}</span>
              </Link>
              {notificationCount === 0 && (
                <AdminBanner tone="success" message="No pending orders, open messages or complaints were returned." />
              )}
            </div>
          )}
        </AdminPanel>
      </div>

      <AdminPanel title="Quick actions" description="Open a control center section.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`${cardClass} group flex items-start gap-3 transition-all duration-200 hover:border-[#B00020] hover:shadow-md`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#E2E2E2] bg-[#FFFFFF] text-[#B00020] transition-colors group-hover:bg-[#B00020] group-hover:text-[#FFFFFF]">
                  <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block font-title text-base font-medium uppercase tracking-wide text-[#000000]">{item.label}</span>
                  <span className="mt-1 block font-sans text-[11px] leading-relaxed text-[#666666]">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/admin/orders" className={buttonPrimaryClass}>Manage orders</Link>
          <Link href="/admin/complaints" className={buttonSecondaryClass}>Review complaints</Link>
          <Link href="/admin/reviews" className={buttonSecondaryClass}>Moderate reviews</Link>
        </div>
      </AdminPanel>

      <div className={`${cardClass} flex flex-wrap items-center gap-3`}>
        <CheckCircle2 size={18} aria-hidden="true" className="text-[#15803D]" />
        <p className="font-sans text-[11px] text-[#555555]">Dashboard data is read directly from the admin API. No sample or projected figures are generated.</p>
      </div>
    </AdminShell>
  );
}
