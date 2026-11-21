"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  DateText,
  KeyValue,
  Money,
  ResponsiveTable,
  StatusBadge,
} from "./AdminPrimitives";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  inputClass,
  labelClass,
  noteClass,
  textareaClass,
} from "./adminStyles";
import type { AdminOrder, OrderStatus, PaymentStatus } from "./types";
import { useAdminResource } from "./useAdminResource";

const orderStatusOptions: OrderStatus[] = ["pending", "confirmed", "in_progress", "under_review", "completed", "cancelled"];
const paymentStatusOptions: PaymentStatus[] = ["pending", "awaiting_payment", "partially_paid", "paid", "refunded"];

type PaymentForm = {
  status: PaymentStatus;
  amount: string;
  provider: string;
  provider_reference: string;
  paid_at: string;
  note: string;
};

const toDateTimeLocal = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function OrdersPanel() {
  const { data, setData, loading, error, reload } = useAdminResource<AdminOrder[]>("/api/v1/admin/orders?limit=200");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusForms, setStatusForms] = useState<Record<string, OrderStatus>>({});
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});
  const [paymentForms, setPaymentForms] = useState<Record<string, PaymentForm>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const orders = data ?? [];
  const filteredOrders = useMemo(() => {
    const source = data ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return source;
    return source.filter((order) =>
      [order.order_number, order.tracking_id, order.customer_name, order.customer_email, order.product_name_snapshot]
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [data, query]);

  const selectedOrder = selectedId ? orders.find((order) => order.id === selectedId) ?? null : null;

  const orderStatusFor = (order: AdminOrder) => statusForms[order.id] ?? order.order_status;

  const paymentFormFor = (order: AdminOrder): PaymentForm => {
    if (paymentForms[order.id]) return paymentForms[order.id];
    const latest = order.payments[0];
    const amount = latest?.amount !== null && latest?.amount !== undefined
      ? latest.amount
      : order.amount;
    return {
      status: order.payment_status,
      amount: amount === null || amount === undefined ? "" : String(amount),
      provider: latest?.provider ?? "",
      provider_reference: latest?.provider_reference ?? "",
      paid_at: toDateTimeLocal(latest?.paid_at),
      note: "",
    };
  };

  const replaceOrder = (updated: AdminOrder) => {
    setData((current) => current?.map((order) => (order.id === updated.id ? updated : order)) ?? [updated]);
  };

  const runAction = async (key: string, task: () => Promise<AdminOrder>, message: string) => {
    setBusyKey(key);
    setActionError("");
    setActionMessage("");
    try {
      const updated = await task();
      replaceOrder(updated);
      setActionMessage(message);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "The order update could not be completed.");
    } finally {
      setBusyKey(null);
    }
  };

  const updateOrderStatus = (order: AdminOrder) => {
    const body = {
      order_status: orderStatusFor(order),
      note: statusNotes[order.id]?.trim() || null,
    };
    void runAction(
      `${order.id}:status`,
      () => apiFetch<AdminOrder>(`/api/v1/admin/orders/${order.id}/status`, { method: "PUT", body: JSON.stringify(body) }),
      "Order status updated.",
    ).then(() => setStatusNotes((current) => ({ ...current, [order.id]: "" })));
  };

  const updatePayment = (order: AdminOrder) => {
    const form = paymentFormFor(order);
    const amount = form.amount.trim() ? Number(form.amount) : null;
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      setActionError("Payment amount must be zero or greater.");
      return;
    }

    let paidAt: string | null = null;
    if (form.paid_at) {
      const parsed = new Date(form.paid_at);
      if (Number.isNaN(parsed.getTime())) {
        setActionError("Paid at is not a valid date.");
        return;
      }
      paidAt = parsed.toISOString();
    }

    const body = {
      status: form.status,
      amount,
      provider: form.provider.trim() || null,
      provider_reference: form.provider_reference.trim() || null,
      paid_at: paidAt,
      note: form.note.trim() || null,
    };

    void runAction(
      `${order.id}:payment`,
      () => apiFetch<AdminOrder>(`/api/v1/admin/orders/${order.id}/payment`, { method: "PUT", body: JSON.stringify(body) }),
      "Payment updated.",
    ).then(() => setPaymentForms((current) => ({ ...current, [order.id]: { ...form, note: "" } })));
  };

  const addNote = (order: AdminOrder) => {
    const note = noteDrafts[order.id]?.trim() ?? "";
    if (!note) {
      setActionError("Enter a note before submitting.");
      return;
    }

    void runAction(
      `${order.id}:note`,
      () =>
        apiFetch<AdminOrder>(`/api/v1/admin/orders/${order.id}/notes`, {
          method: "POST",
          body: JSON.stringify({ note }),
        }),
      "Note added.",
    ).then(() => setNoteDrafts((current) => ({ ...current, [order.id]: "" })));
  };

  if (loading) return <AdminLoadingBlock label="Loading orders" />;
  if (error) return <AdminErrorBlock message={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {actionError && (
        <div role="alert" className={`${cardClass} border-burgundy/60 text-sm text-cream`}>
          {actionError}
        </div>
      )}
      {actionMessage && <div className={`${cardClass} text-sm text-cream`}>{actionMessage}</div>}

      <AdminPanel title="Order queue" description="All orders returned by the admin orders endpoint. Select an order to manage it.">
        <label className="block">
          <span className={labelClass}>Search orders</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Order number, tracking ID, customer or product"
            className={`${inputClass} mt-2`}
          />
        </label>

        <div className="mt-5">
          <ResponsiveTable
            columns={[
              { key: "order", label: "Order" },
              { key: "customer", label: "Customer" },
              { key: "product", label: "Product" },
              { key: "status", label: "Status" },
              { key: "payment", label: "Payment" },
              { key: "amount", label: "Amount" },
              { key: "created", label: "Created" },
              { key: "action", label: "" },
            ]}
            rows={filteredOrders}
            rowKey={(order) => order.id}
            empty={<AdminEmptyBlock title="No orders found" description="Adjust the search or reload the order list." />}
            renderCell={(order, key) => {
              if (key === "order") {
                return (
                  <div>
                    <p className="font-sans text-sm font-medium text-cream">{order.order_number}</p>
                    <p className="mt-1 font-sans text-[10px] text-cream/40">{order.tracking_id}</p>
                  </div>
                );
              }
              if (key === "customer") {
                return (
                  <div className="font-sans text-xs">
                    <p className="text-cream/85">{order.customer_name}</p>
                    <p className="text-cream/50">{order.customer_email}</p>
                  </div>
                );
              }
              if (key === "product") return <span className="font-sans text-xs text-cream/70">{order.product_name_snapshot}</span>;
              if (key === "status") return <StatusBadge value={order.order_status} />;
              if (key === "payment") return <StatusBadge value={order.payment_status} />;
              if (key === "amount") {
                return <span className="font-sans text-sm"><Money value={order.amount} currency={order.currency} /></span>;
              }
              if (key === "created") return <DateText value={order.created_at} withTime />;
              return (
                <button
                  type="button"
                  onClick={() => setSelectedId(order.id)}
                  className="border border-cream/20 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/70 hover:border-burgundy hover:text-burgundy"
                >
                  Manage
                </button>
              );
            }}
            renderCard={(order) => (
              <div className={cardClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-sans text-sm font-medium text-cream">{order.order_number}</p>
                    <p className="mt-1 font-sans text-[10px] text-cream/40">{order.tracking_id}</p>
                  </div>
                  <StatusBadge value={order.order_status} />
                </div>
                <div className="mt-4 grid gap-2 font-sans text-xs text-cream/65">
                  <p>{order.customer_name}</p>
                  <p>{order.product_name_snapshot}</p>
                  <p><Money value={order.amount} currency={order.currency} /></p>
                  <p><DateText value={order.created_at} withTime /></p>
                </div>
                <button type="button" onClick={() => setSelectedId(order.id)} className={`${buttonSecondaryClass} mt-4 w-full`}>
                  Manage order
                </button>
              </div>
            )}
          />
        </div>
      </AdminPanel>

      {selectedOrder && (
        <div className="space-y-6">
          <AdminPanel
            title={`Order ${selectedOrder.order_number}`}
            description={`Tracking ID ${selectedOrder.tracking_id} · Created ${new Date(selectedOrder.created_at).toLocaleString("en-GB")}`}
            action={
              <button type="button" onClick={() => setSelectedId(null)} className={buttonSecondaryClass}>
                Close
              </button>
            }
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <KeyValue label="Customer">{selectedOrder.customer_name}</KeyValue>
              <KeyValue label="Email">{selectedOrder.customer_email}</KeyValue>
              <KeyValue label="Phone">{selectedOrder.customer_phone}</KeyValue>
              <KeyValue label="Business">{selectedOrder.business_name ?? "—"}</KeyValue>
              <KeyValue label="Order status"><StatusBadge value={selectedOrder.order_status} /></KeyValue>
              <KeyValue label="Payment status"><StatusBadge value={selectedOrder.payment_status} /></KeyValue>
              <KeyValue label="Project requirements">{selectedOrder.project_requirements ?? "—"}</KeyValue>
              <KeyValue label="Additional instructions">{selectedOrder.additional_instructions ?? "—"}</KeyValue>
              <KeyValue label="Admin notes">{selectedOrder.admin_notes ?? "—"}</KeyValue>
            </div>

            <div className="mt-6 border-t border-cream/10 pt-5">
              <p className={labelClass}>Order items</p>
              {selectedOrder.items.length ? (
                <ul className="mt-3 space-y-2">
                  {selectedOrder.items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 border border-cream/10 bg-cream/[0.02] px-4 py-3 font-sans text-xs">
                      <span className="text-cream/85">
                        {item.product_name_snapshot} · Qty {item.quantity}
                      </span>
                      <span className="text-cream/65"><Money value={item.line_total} currency={selectedOrder.currency} /></span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`${noteClass} mt-2`}>No items were returned for this order.</p>
              )}
            </div>
          </AdminPanel>

          <div className="grid gap-6 xl:grid-cols-2">
            <AdminPanel title="Update order status" description="Sends the order status and optional note to the admin status route.">
              <div className="grid gap-4">
                <label>
                  <span className={labelClass}>Order status</span>
                  <select
                    value={orderStatusFor(selectedOrder)}
                    onChange={(event) => setStatusForms((current) => ({ ...current, [selectedOrder.id]: event.target.value as OrderStatus }))}
                    className={`${inputClass} mt-2`}
                  >
                    {orderStatusOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Status note (optional)</span>
                  <textarea
                    rows={3}
                    value={statusNotes[selectedOrder.id] ?? ""}
                    onChange={(event) => setStatusNotes((current) => ({ ...current, [selectedOrder.id]: event.target.value }))}
                    className={`${textareaClass} mt-2`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => updateOrderStatus(selectedOrder)}
                  disabled={busyKey === `${selectedOrder.id}:status`}
                  className={buttonPrimaryClass}
                >
                  {busyKey === `${selectedOrder.id}:status` ? "Updating" : "Update status"}
                </button>
              </div>
            </AdminPanel>

            <AdminPanel title="Update payment" description="Sends payment details to the admin payment route for this order.">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className={labelClass}>Payment status</span>
                  <select
                    value={paymentFormFor(selectedOrder).status}
                    onChange={(event) =>
                      setPaymentForms((current) => ({
                        ...current,
                        [selectedOrder.id]: { ...paymentFormFor(selectedOrder), status: event.target.value as PaymentStatus },
                      }))
                    }
                    className={`${inputClass} mt-2`}
                  >
                    {paymentStatusOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={labelClass}>Amount</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentFormFor(selectedOrder).amount}
                    onChange={(event) =>
                      setPaymentForms((current) => ({
                        ...current,
                        [selectedOrder.id]: { ...paymentFormFor(selectedOrder), amount: event.target.value },
                      }))
                    }
                    className={`${inputClass} mt-2`}
                  />
                </label>
                <label>
                  <span className={labelClass}>Paid at</span>
                  <input
                    type="datetime-local"
                    value={paymentFormFor(selectedOrder).paid_at}
                    onChange={(event) =>
                      setPaymentForms((current) => ({
                        ...current,
                        [selectedOrder.id]: { ...paymentFormFor(selectedOrder), paid_at: event.target.value },
                      }))
                    }
                    className={`${inputClass} mt-2`}
                  />
                </label>
                <label>
                  <span className={labelClass}>Provider</span>
                  <input
                    value={paymentFormFor(selectedOrder).provider}
                    onChange={(event) =>
                      setPaymentForms((current) => ({
                        ...current,
                        [selectedOrder.id]: { ...paymentFormFor(selectedOrder), provider: event.target.value },
                      }))
                    }
                    className={`${inputClass} mt-2`}
                  />
                </label>
                <label>
                  <span className={labelClass}>Provider reference</span>
                  <input
                    value={paymentFormFor(selectedOrder).provider_reference}
                    onChange={(event) =>
                      setPaymentForms((current) => ({
                        ...current,
                        [selectedOrder.id]: { ...paymentFormFor(selectedOrder), provider_reference: event.target.value },
                      }))
                    }
                    className={`${inputClass} mt-2`}
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className={labelClass}>Payment note (optional)</span>
                  <textarea
                    rows={3}
                    value={paymentFormFor(selectedOrder).note}
                    onChange={(event) =>
                      setPaymentForms((current) => ({
                        ...current,
                        [selectedOrder.id]: { ...paymentFormFor(selectedOrder), note: event.target.value },
                      }))
                    }
                    className={`${textareaClass} mt-2`}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => updatePayment(selectedOrder)}
                  disabled={busyKey === `${selectedOrder.id}:payment`}
                  className={`${buttonPrimaryClass} sm:col-span-2`}
                >
                  {busyKey === `${selectedOrder.id}:payment` ? "Updating" : "Update payment"}
                </button>
              </div>
            </AdminPanel>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <AdminPanel title="Add internal note" description="Internal notes are stored against this order by the backend.">
              <label className="block">
                <span className={labelClass}>Note</span>
                <textarea
                  rows={4}
                  value={noteDrafts[selectedOrder.id] ?? ""}
                  onChange={(event) => setNoteDrafts((current) => ({ ...current, [selectedOrder.id]: event.target.value }))}
                  className={`${textareaClass} mt-2`}
                />
              </label>
              <button
                type="button"
                onClick={() => addNote(selectedOrder)}
                disabled={busyKey === `${selectedOrder.id}:note`}
                className={`${buttonSecondaryClass} mt-4`}
              >
                {busyKey === `${selectedOrder.id}:note` ? "Adding" : "Add note"}
              </button>
            </AdminPanel>

            <AdminPanel title="Status timeline" description="History returned with the admin order record.">
              {selectedOrder.status_history.length ? (
                <ol className="space-y-3">
                  {selectedOrder.status_history.map((entry) => (
                    <li key={entry.id} className="border-l border-burgundy pl-4">
                      <p className="font-sans text-xs text-cream/85">
                        {entry.from_status ? `${entry.from_status} → ` : ""}{entry.to_status}
                      </p>
                      <p className="mt-1 font-sans text-[10px] text-cream/45"><DateText value={entry.created_at} withTime /></p>
                      {entry.note && <p className="mt-1 font-sans text-xs text-cream/60">{entry.note}</p>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={noteClass}>No status history has been recorded for this order.</p>
              )}
            </AdminPanel>
          </div>

          <AdminPanel title="Payments on this order" description="Payment records returned with the order. No placeholder payments are generated.">
            {selectedOrder.payments.length ? (
              <ul className="space-y-2">
                {selectedOrder.payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 border border-cream/10 bg-cream/[0.02] px-4 py-3">
                    <div className="font-sans text-xs">
                      <p className="text-cream/85"><Money value={payment.amount} currency={payment.currency} /></p>
                      <p className="mt-1 text-cream/45">{payment.provider ?? "No provider"} · <DateText value={payment.created_at} withTime /></p>
                    </div>
                    <StatusBadge value={payment.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={noteClass}>No payments are recorded for this order.</p>
            )}
          </AdminPanel>
        </div>
      )}
    </div>
  );
}
