"use client";

import { useMemo } from "react";
import {
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  DateText,
  Money,
  ResponsiveTable,
  StatCard,
  StatusBadge,
} from "./AdminPrimitives";
import { cardClass, noteClass } from "./adminStyles";
import type { AdminOrder, Payment, Report } from "./types";
import { useAdminResource } from "./useAdminResource";

type PaymentRow = Payment & { order_number?: string; customer_name?: string };

const byNewest = (left: PaymentRow, right: PaymentRow) =>
  new Date(right.created_at).getTime() - new Date(left.created_at).getTime();

export function PaymentsPanel() {
  const payments = useAdminResource<Payment[]>("/api/v1/admin/payments");
  const orders = useAdminResource<AdminOrder[]>(payments.error ? "/api/v1/admin/orders?limit=200" : null);
  const reports = useAdminResource<Report>("/api/v1/admin/reports");

  const usingFallback = Boolean(payments.error);

  const rows = useMemo<PaymentRow[]>(() => {
    if (!usingFallback) return [...(payments.data ?? [])].sort(byNewest);
    return (orders.data ?? [])
      .flatMap((order) =>
        (order.payments ?? []).map((payment) => ({
          ...payment,
          order_number: order.order_number,
          customer_name: order.customer_name,
        })),
      )
      .sort(byNewest);
  }, [usingFallback, payments.data, orders.data]);

  if (payments.loading || (usingFallback && orders.loading) || reports.loading) {
    return <AdminLoadingBlock label="Loading payments" />;
  }

  if (usingFallback && orders.error) {
    return (
      <AdminErrorBlock
        message={`Payments API unavailable (${payments.error}). Order fallback also failed: ${orders.error}`}
        onRetry={() => {
          payments.reload();
          orders.reload();
          reports.reload();
        }}
      />
    );
  }

  const paymentStatuses = Object.entries(reports.data?.payments_by_status ?? {}).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return (
    <div className="space-y-6">
      <AdminPanel
        title="Payment source"
        description={
          usingFallback
            ? "Fallback mode: the payments endpoint could not be reached, so records are derived from embedded order payments."
            : "Primary source: GET /api/v1/admin/payments returns individual payment records."
        }
      >
        <p className={`${noteClass} ${usingFallback ? "text-burgundy" : ""}`}>
          {usingFallback
            ? `Unavailable endpoint: ${payments.error}. Data below is not from the payments list API and is shown only as a fallback.`
            : "Amounts, statuses, providers, references and dates come directly from the admin payments response. Revenue totals come from the paid-only report."}
        </p>
      </AdminPanel>

      {reports.error && (
        <div role="alert" className={`${cardClass} border-burgundy/60 text-sm text-cream`}>
          Report totals are unavailable: {reports.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (paid only)"
          value={<Money value={reports.data?.revenue_paid} />}
          note="Payments with status paid."
        />
        <StatCard label="Paid orders" value={reports.data?.paid_orders ?? 0} />
        <StatCard
          label="Payment records shown"
          value={rows.length}
          note={usingFallback ? "Derived from loaded orders." : "From the admin payments endpoint."}
        />
        <StatCard label="Average paid order" value={<Money value={reports.data?.average_order_value} />} />
      </div>

      <AdminPanel title="Payment status counts" description="Database counts grouped by payment status.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paymentStatuses.map(([status, count]) => (
            <div key={status} className={`${cardClass} flex items-center justify-between gap-4`}>
              <StatusBadge value={status} />
              <span className="font-condense text-xl text-cream">{count}</span>
            </div>
          ))}
          {paymentStatuses.length === 0 && <p className={noteClass}>No payment status counts were returned.</p>}
        </div>
      </AdminPanel>

      <AdminPanel
        title={usingFallback ? "Payments derived from orders (fallback)" : "Recorded payments"}
        description={
          usingFallback
            ? "Payment records embedded in admin orders. This is not the dedicated payments list."
            : "Payment records returned by GET /api/v1/admin/payments. No example transactions are generated."
        }
      >
        {rows.length === 0 ? (
          <AdminEmptyBlock
            title="No payments are recorded"
            description={
              usingFallback
                ? "The admin orders response contains no payment records."
                : "The admin payments endpoint returned no payment records."
            }
          />
        ) : (
          <ResponsiveTable
            columns={[
              { key: "payment", label: "Payment" },
              { key: "order", label: "Order" },
              { key: "amount", label: "Amount" },
              { key: "status", label: "Status" },
              { key: "provider", label: "Provider" },
              { key: "reference", label: "Reference" },
              { key: "paid", label: "Paid at" },
              { key: "created", label: "Created" },
            ]}
            rows={rows}
            rowKey={(payment) => payment.id}
            renderCell={(payment, key) => {
              if (key === "payment") {
                return (
                  <div>
                    <p className="font-sans text-xs font-medium text-cream">{payment.id}</p>
                    {payment.customer_name && (
                      <p className="mt-1 font-sans text-[10px] text-cream/45">{payment.customer_name}</p>
                    )}
                  </div>
                );
              }
              if (key === "order") {
                return (
                  <div>
                    <p className="font-sans text-xs text-cream/80">{payment.order_number ?? payment.order_id}</p>
                    {payment.order_number && (
                      <p className="mt-1 font-sans text-[10px] text-cream/40">{payment.order_id}</p>
                    )}
                  </div>
                );
              }
              if (key === "amount") {
                return <span className="font-sans text-sm"><Money value={payment.amount} currency={payment.currency} /></span>;
              }
              if (key === "status") return <StatusBadge value={payment.status} />;
              if (key === "provider") return <span className="font-sans text-xs text-cream/65">{payment.provider ?? "—"}</span>;
              if (key === "reference") {
                return <span className="font-sans text-[11px] text-cream/50">{payment.provider_reference ?? "—"}</span>;
              }
              if (key === "paid") return <DateText value={payment.paid_at} withTime />;
              return <DateText value={payment.created_at} withTime />;
            }}
            renderCard={(payment) => (
              <div className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-sans text-sm font-medium text-cream">{payment.order_number ?? payment.order_id}</p>
                    <p className="mt-1 break-all font-sans text-[10px] text-cream/40">{payment.id}</p>
                    {payment.customer_name && <p className="mt-1 font-sans text-[11px] text-cream/55">{payment.customer_name}</p>}
                  </div>
                  <StatusBadge value={payment.status} />
                </div>
                <div className="mt-4 grid gap-2 font-sans text-xs text-cream/65">
                  <p><Money value={payment.amount} currency={payment.currency} /></p>
                  <p>{payment.provider ?? "No provider"}</p>
                  <p>{payment.provider_reference ?? "No reference"}</p>
                  <p>Paid <DateText value={payment.paid_at} withTime /></p>
                  <p>Created <DateText value={payment.created_at} withTime /></p>
                </div>
              </div>
            )}
          />
        )}
      </AdminPanel>
    </div>
  );
}
