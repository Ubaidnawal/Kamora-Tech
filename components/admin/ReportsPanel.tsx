"use client";

import { AdminEmptyBlock, AdminErrorBlock, AdminLoadingBlock, AdminPanel, Money, StatCard } from "./AdminPrimitives";
import type { AdminDashboard, Report } from "./types";
import { useAdminResource } from "./useAdminResource";

export function ReportsPanel() {
  const dashboard = useAdminResource<AdminDashboard>("/api/v1/admin/dashboard");
  const reports = useAdminResource<Report>("/api/v1/admin/reports");

  if (dashboard.loading || reports.loading) return <AdminLoadingBlock label="Loading reports" />;

  const error = dashboard.error || reports.error;
  if (error) {
    return (
      <AdminErrorBlock
        message={error}
        onRetry={() => {
          dashboard.reload();
          reports.reload();
        }}
      />
    );
  }

  if (!dashboard.data || !reports.data) {
    return <AdminEmptyBlock title="No report data" description="The admin API did not return a report payload." />;
  }

  const orderStatuses = Object.entries(reports.data.orders_by_status).sort(([left], [right]) => left.localeCompare(right));
  const paymentStatuses = Object.entries(reports.data.payments_by_status).sort(([left], [right]) => left.localeCompare(right));

  return (
    <div className="space-y-6">
      <AdminPanel
        title="Database overview"
        description="Totals from GET /api/v1/admin/dashboard. Revenue counts only payments with status paid; the response does not include a currency code."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Users" value={dashboard.data.total_users} />
          <StatCard label="Products" value={dashboard.data.total_products} />
          <StatCard label="Categories" value={dashboard.data.total_categories} />
          <StatCard label="Orders" value={dashboard.data.total_orders} />
          <StatCard label="Pending orders" value={dashboard.data.pending_orders} />
          <StatCard label="Paid orders" value={dashboard.data.paid_orders} />
          <StatCard label="Open messages" value={dashboard.data.open_messages} />
          <StatCard
            label="Paid revenue"
            value={<Money value={dashboard.data.revenue_paid} />}
            note="Sum of payments marked paid."
          />
        </div>
      </AdminPanel>

      <AdminPanel
        title="Commerce report"
        description="Computed by GET /api/v1/admin/reports from orders, payments and paid order items."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total orders" value={reports.data.total_orders} />
          <StatCard label="Paid orders" value={reports.data.paid_orders} />
          <StatCard
            label="Pending payments"
            value={reports.data.pending_payments}
            note="Orders still marked pending."
          />
          <StatCard label="Cancelled orders" value={reports.data.cancelled_orders} />
          <StatCard label="Total customers" value={reports.data.total_customers} />
          <StatCard label="Completed projects" value={reports.data.completed_projects} />
          <StatCard
            label="Revenue (paid only)"
            value={<Money value={reports.data.revenue_paid} />}
            note="No pending or refunded amounts included."
          />
          <StatCard
            label="Average paid order"
            value={<Money value={reports.data.average_order_value} />}
            note="Paid revenue divided by paid orders."
          />
        </div>
      </AdminPanel>

      <AdminPanel
        title="Monthly orders"
        description="Order counts grouped by creation month by the reports endpoint."
      >
        {reports.data.monthly_orders.length ? (
          <div className="font-sans text-xs">
            <div className="grid grid-cols-2 gap-4 border-b border-burgundy/30 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/50">
              <span>Month</span>
              <span className="text-right">Orders</span>
            </div>
            {reports.data.monthly_orders.map((entry) => (
              <div
                key={entry.month}
                className="grid grid-cols-2 gap-4 border-b border-cream/10 py-2 text-cream/75 last:border-0"
              >
                <span>{entry.month}</span>
                <span className="text-right font-condense text-base text-cream">{entry.orders}</span>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyBlock title="No monthly data" description="The reports endpoint returned no monthly order groups." />
        )}
      </AdminPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="Orders by status" description="Real counts grouped from the orders table.">
          <div className="space-y-2">
            {orderStatuses.map(([status, count]) => (
              <div key={status} className="flex items-center justify-between gap-4 border-b border-cream/10 py-2 font-sans text-xs">
                <span className="uppercase tracking-[0.12em] text-cream/70">{status.replaceAll("_", " ")}</span>
                <span className="font-condense text-lg text-cream">{count}</span>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Payments by status" description="Real counts grouped from the payments table.">
          <div className="space-y-2">
            {paymentStatuses.map(([status, count]) => (
              <div key={status} className="flex items-center justify-between gap-4 border-b border-cream/10 py-2 font-sans text-xs">
                <span className="uppercase tracking-[0.12em] text-cream/70">{status.replaceAll("_", " ")}</span>
                <span className="font-condense text-lg text-cream">{count}</span>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="Top products" description="Paid order items ranked by line revenue. No calculated estimates are added.">
        {reports.data.top_products.length ? (
          <div className="space-y-3">
            {reports.data.top_products.map((product, index) => (
              <div key={`${product.product_name}-${index}`} className="flex flex-wrap items-center justify-between gap-4 border border-cream/10 bg-cream/[0.02] px-4 py-3">
                <div className="min-w-0">
                  <p className="font-sans text-sm text-cream">{product.product_name}</p>
                  <p className="mt-1 font-sans text-[10px] text-cream/45">{product.units_sold} units sold in paid orders</p>
                </div>
                <p className="font-sans text-sm text-cream/80"><Money value={product.revenue} /></p>
              </div>
            ))}
          </div>
        ) : (
          <AdminEmptyBlock title="No paid product sales" description="Top products are derived from paid orders only." />
        )}
      </AdminPanel>
    </div>
  );
}
