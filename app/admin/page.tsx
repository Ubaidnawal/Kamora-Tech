"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  DateText,
  Money,
  StatCard,
  StatusBadge,
} from "@/components/admin/AdminPrimitives";
import { AdminShell } from "@/components/admin/AdminShell";
import { cardClass, noteClass } from "@/components/admin/adminStyles";
import type { AdminDashboard } from "@/components/admin/types";
import { useAdminResource } from "@/components/admin/useAdminResource";
import Link from "next/link";

const shortcuts = [
  { label: "Users", href: "/admin/users", description: "Accounts and status control" },
  { label: "Products", href: "/admin/products", description: "Catalog create, edit and soft delete" },
  { label: "Orders", href: "/admin/orders", description: "Fulfilment, payment and notes" },
  { label: "Payments", href: "/admin/payments", description: "Payment records and paid totals" },
  { label: "Messages", href: "/admin/messages", description: "Customer inbox and replies" },
  { label: "Reports", href: "/admin/reports", description: "Commerce report and monthly orders" },
  { label: "Settings", href: "/admin/settings", description: "Account and site settings" },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAdminResource<AdminDashboard>("/api/v1/admin/dashboard");

  return (
    <AdminShell
      title="Dashboard"
      description="Live database totals from the admin dashboard endpoint. Revenue is limited to payments marked paid."
    >
      <AdminPanel
        title="Operations overview"
        description={user ? `Signed in as ${user.email}` : "Administrator session active."}
      >
        {loading ? (
          <AdminLoadingBlock label="Loading dashboard" />
        ) : error ? (
          <AdminErrorBlock message={error} onRetry={reload} />
        ) : data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total users" value={data.total_users} />
            <StatCard label="Total products" value={data.total_products} note="Non-deleted catalog records." />
            <StatCard label="Total categories" value={data.total_categories} note="Non-deleted categories." />
            <StatCard label="Total orders" value={data.total_orders} />
            <StatCard label="Pending orders" value={data.pending_orders} />
            <StatCard label="Confirmed orders" value={data.confirmed_orders} />
            <StatCard label="In progress orders" value={data.in_progress_orders} />
            <StatCard label="Completed orders" value={data.completed_orders} />
            <StatCard label="Paid orders" value={data.paid_orders} note="Orders with payment status paid." />
            <StatCard label="Open messages" value={data.open_messages} />
            <StatCard
              label="Paid revenue"
              value={<Money value={data.revenue_paid} />}
              note="Sum of payments with status paid."
            />
          </div>
        ) : (
          <AdminLoadingBlock label="Waiting for dashboard data" />
        )}
        <p className={`${noteClass} mt-5`}>
          All values above are returned by GET /api/v1/admin/dashboard. No sample or projected figures are generated.
        </p>
      </AdminPanel>

      {data && (
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminPanel
            title="Recent orders"
            description="Five most recent orders returned by the dashboard endpoint."
          >
            {data.recent_orders.length ? (
              <ul className="space-y-3">
                {data.recent_orders.map((order) => (
                  <li key={order.id} className={cardClass}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-sans text-sm font-medium text-cream">{order.order_number}</p>
                        <p className="mt-1 font-sans text-[10px] text-cream/45">
                          {order.customer_name} · {order.product_name_snapshot}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge value={order.order_status} />
                        <StatusBadge value={order.payment_status} />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-sans text-[11px] text-cream/55">
                      <span><Money value={order.amount} currency={order.currency} /></span>
                      <span><DateText value={order.created_at} withTime /></span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <AdminEmptyBlock title="No recent orders" description="The dashboard response contains no recent orders." />
            )}
          </AdminPanel>

          <AdminPanel
            title="Recent registrations"
            description="Five most recently created accounts returned by the dashboard endpoint."
          >
            {data.recent_registrations.length ? (
              <ul className="space-y-3">
                {data.recent_registrations.map((registration) => (
                  <li key={registration.id} className={cardClass}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-sans text-sm font-medium text-cream">{registration.full_name}</p>
                        <p className="mt-1 break-all font-sans text-[10px] text-cream/45">{registration.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge value={registration.status} />
                        {registration.roles.map((role) => <StatusBadge key={role} value={role} />)}
                      </div>
                    </div>
                    <div className="mt-3 font-sans text-[11px] text-cream/55">
                      Joined <DateText value={registration.created_at} withTime />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <AdminEmptyBlock title="No recent registrations" description="The dashboard response contains no recent accounts." />
            )}
          </AdminPanel>
        </div>
      )}

      <AdminPanel title="Shortcuts" description="Open a control center section.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shortcuts.map((item) => (
            <Link key={item.href} href={item.href} className={`${cardClass} group transition-colors hover:border-burgundy`}>
              <p className="font-title text-base font-medium uppercase tracking-wide text-cream transition-colors group-hover:text-burgundy">
                {item.label}
              </p>
              <p className="mt-2 font-sans text-[11px] leading-relaxed text-cream/50">{item.description}</p>
            </Link>
          ))}
        </div>
      </AdminPanel>
    </AdminShell>
  );
}
