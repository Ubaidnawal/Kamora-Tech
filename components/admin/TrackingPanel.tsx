"use client";

import { useMemo, useState } from "react";
import {
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  DateText,
  KeyValue,
  ResponsiveTable,
  StatusBadge,
} from "./AdminPrimitives";
import { cardClass, inputClass, labelClass, noteClass } from "./adminStyles";
import type { AdminOrder } from "./types";
import { useAdminResource } from "./useAdminResource";

export function TrackingPanel() {
  const { data, loading, error, reload } = useAdminResource<AdminOrder[]>("/api/v1/admin/orders?limit=200");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const orders = data ?? [];
  const filtered = useMemo(() => {
    const source = data ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return source;
    return source.filter((order) =>
      [order.tracking_id, order.order_number, order.customer_name, order.customer_email]
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [data, query]);

  const selected = selectedId ? orders.find((order) => order.id === selectedId) ?? null : null;

  if (loading) return <AdminLoadingBlock label="Loading tracking records" />;
  if (error) return <AdminErrorBlock message={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <AdminPanel
        title="Tracking source"
        description="No dedicated admin tracking endpoint is defined. Every row below comes from the admin orders response, including its status history."
      >
        <p className={noteClass}>
          Search by tracking ID, order number, customer name or email. Select a row to inspect the real timeline returned by the backend.
        </p>
      </AdminPanel>

      <AdminPanel title="Order tracking" description={`${filtered.length.toString().padStart(2, "0")} tracking records shown.`}>
        <label className="block">
          <span className={labelClass}>Search tracking records</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tracking ID, order number or customer"
            className={`${inputClass} mt-2`}
          />
        </label>

        <div className="mt-5">
          <ResponsiveTable
            columns={[
              { key: "tracking", label: "Tracking ID" },
              { key: "order", label: "Order" },
              { key: "customer", label: "Customer" },
              { key: "status", label: "Order status" },
              { key: "payment", label: "Payment" },
              { key: "created", label: "Created" },
              { key: "action", label: "" },
            ]}
            rows={filtered}
            rowKey={(order) => order.id}
            empty={<AdminEmptyBlock title="No tracking records" description="Adjust the search or reload the order list." />}
            renderCell={(order, key) => {
              if (key === "tracking") return <span className="font-sans text-xs font-medium text-cream">{order.tracking_id}</span>;
              if (key === "order") return <span className="font-sans text-xs text-cream/70">{order.order_number}</span>;
              if (key === "customer") return <span className="font-sans text-xs text-cream/70">{order.customer_name}</span>;
              if (key === "status") return <StatusBadge value={order.order_status} />;
              if (key === "payment") return <StatusBadge value={order.payment_status} />;
              if (key === "created") return <DateText value={order.created_at} withTime />;
              return (
                <button
                  type="button"
                  onClick={() => setSelectedId(order.id)}
                  className="border border-cream/20 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/70 hover:border-burgundy hover:text-burgundy"
                >
                  Timeline
                </button>
              );
            }}
            renderCard={(order) => (
              <div className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-sans text-sm font-medium text-cream">{order.tracking_id}</p>
                    <p className="mt-1 font-sans text-[10px] text-cream/40">{order.order_number}</p>
                  </div>
                  <StatusBadge value={order.order_status} />
                </div>
                <div className="mt-4 grid gap-2 font-sans text-xs text-cream/65">
                  <p>{order.customer_name}</p>
                  <p><DateText value={order.created_at} withTime /></p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(order.id)}
                  className="mt-4 w-full border border-cream/20 px-3 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/70 hover:border-burgundy hover:text-burgundy"
                >
                  View timeline
                </button>
              </div>
            )}
          />
        </div>
      </AdminPanel>

      {selected && (
        <AdminPanel
          title={`Timeline ${selected.tracking_id}`}
          description={`Order ${selected.order_number} · ${selected.product_name_snapshot}`}
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <KeyValue label="Current status"><StatusBadge value={selected.order_status} /></KeyValue>
            <KeyValue label="Payment"><StatusBadge value={selected.payment_status} /></KeyValue>
            <KeyValue label="Created"><DateText value={selected.created_at} withTime /></KeyValue>
            <KeyValue label="Last updated"><DateText value={selected.updated_at} withTime /></KeyValue>
          </div>

          <div className="mt-6 border-t border-cream/10 pt-5">
            <p className={labelClass}>Status history</p>
            {selected.status_history.length ? (
              <ol className="mt-4 space-y-4">
                {selected.status_history.map((entry) => (
                  <li key={entry.id} className="border-l border-burgundy pl-4">
                    <p className="font-sans text-xs text-cream/85">
                      {entry.from_status ? `${entry.from_status} → ` : ""}{entry.to_status}
                    </p>
                    <p className="mt-1 font-sans text-[10px] text-cream/45"><DateText value={entry.created_at} withTime /></p>
                    {entry.note && <p className="mt-2 font-sans text-xs text-cream/60">{entry.note}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className={`${noteClass} mt-2`}>No status history has been recorded for this tracking ID.</p>
            )}
          </div>
        </AdminPanel>
      )}
    </div>
  );
}
