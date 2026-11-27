"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  AdminBanner,
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  ConfirmDialog,
  DateText,
  KeyValue,
  Money,
  ResponsiveTable,
  StatusBadge,
} from "./AdminPrimitives";
import {
  buttonDangerClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  buttonSuccessClass,
  buttonWarningClass,
  cardClass,
  inputClass,
  labelClass,
  noteClass,
  textareaClass,
} from "./adminStyles";
import type { AdminOrder, OrderStatus, PaymentStatus } from "./types";
import { useAdminMutation } from "./useAdminMutation";
import { useAdminResource } from "./useAdminResource";
import { Download, Printer } from "lucide-react";

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

type DetailsForm = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  business_name: string;
  project_requirements: string;
  additional_instructions: string;
  tracking_id: string;
  delivery_info: string;
};

const toDateTimeLocal = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

function detailsFromOrder(order: AdminOrder): DetailsForm {
  return {
    customer_name: order.customer_name ?? "",
    customer_email: order.customer_email ?? "",
    customer_phone: order.customer_phone ?? "",
    business_name: order.business_name ?? "",
    project_requirements: order.project_requirements ?? "",
    additional_instructions: order.additional_instructions ?? "",
    tracking_id: order.tracking_id ?? "",
    delivery_info: order.delivery_info ?? "",
  };
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function OrdersPanel() {
  const { data, setData, loading, error, reload } = useAdminResource<AdminOrder[]>("/api/v1/admin/orders?limit=200");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [paymentFilter, setPaymentFilter] = useState<"all" | PaymentStatus>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusForms, setStatusForms] = useState<Record<string, OrderStatus>>({});
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});
  const [paymentForms, setPaymentForms] = useState<Record<string, PaymentForm>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [detailsForms, setDetailsForms] = useState<Record<string, DetailsForm>>({});
  const [cancelTarget, setCancelTarget] = useState<AdminOrder | null>(null);
  const mutation = useAdminMutation();

  useEffect(() => {
    const afterPrint = () => document.body.classList.remove("printing-invoice");
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("afterprint", afterPrint);
      document.body.classList.remove("printing-invoice");
    };
  }, []);

  const orders = useMemo(() => data ?? [], [data]);
  const filteredOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesText =
        !needle ||
        [order.id, order.order_number, order.tracking_id, order.customer_name, order.customer_email, order.product_name_snapshot]
          .some((value) => value?.toLowerCase().includes(needle));
      const orderDate = new Date(order.created_at);
      const day = Number.isNaN(orderDate.getTime()) ? "" : orderDate.toISOString().slice(0, 10);
      const matchesFrom = !dateFrom || (day && day >= dateFrom);
      const matchesTo = !dateTo || (day && day <= dateTo);
      return (
        matchesText &&
        (statusFilter === "all" || order.order_status === statusFilter) &&
        (paymentFilter === "all" || order.payment_status === paymentFilter) &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [dateFrom, dateTo, orders, paymentFilter, query, statusFilter]);

  const selectedOrder = selectedId ? orders.find((order) => order.id === selectedId) ?? null : null;

  useEffect(() => {
    if (!selectedOrder || detailsForms[selectedOrder.id]) return;
    setDetailsForms((current) => ({ ...current, [selectedOrder.id]: detailsFromOrder(selectedOrder) }));
  }, [detailsForms, selectedOrder]);

  const orderStatusFor = (order: AdminOrder) => statusForms[order.id] ?? order.order_status;

  const paymentFormFor = (order: AdminOrder): PaymentForm => {
    if (paymentForms[order.id]) return paymentForms[order.id];
    const latest = order.payments?.[0];
    const amount = latest?.amount ?? order.amount;
    return {
      status: order.payment_status,
      amount: amount === null || amount === undefined ? "" : String(amount),
      provider: latest?.provider ?? "",
      provider_reference: latest?.provider_reference ?? "",
      paid_at: toDateTimeLocal(latest?.paid_at),
      note: "",
    };
  };

  const detailsFormFor = (order: AdminOrder): DetailsForm => detailsForms[order.id] ?? detailsFromOrder(order);

  const replaceOrder = (updated: AdminOrder) => {
    setData((current) => current?.map((order) => (order.id === updated.id ? updated : order)) ?? [updated]);
  };

  const updateOrderStatus = async (order: AdminOrder, status: OrderStatus, message = "Order status updated.") => {
    const body = {
      order_status: status,
      note: statusNotes[order.id]?.trim() || null,
    };
    const updated = await mutation.run(
      `${order.id}:status`,
      () => apiFetch<AdminOrder>(`/api/v1/admin/orders/${order.id}/status`, { method: "PUT", body: JSON.stringify(body) }),
      message,
    );
    if (updated) {
      replaceOrder(updated);
      setStatusNotes((current) => ({ ...current, [order.id]: "" }));
    }
  };

  const markPaid = async (order: AdminOrder) => {
    const updated = await mutation.run(
      `${order.id}:payment`,
      () =>
        apiFetch<AdminOrder>(`/api/v1/admin/orders/${order.id}/payment`, {
          method: "PUT",
          body: JSON.stringify({
            status: "paid",
            amount: order.amount ?? null,
            provider: null,
            provider_reference: null,
            paid_at: new Date().toISOString(),
            note: "Payment marked paid from the order queue.",
          }),
        }),
      "Order marked as paid.",
    );
    if (updated) replaceOrder(updated);
  };

  const updatePayment = async (order: AdminOrder) => {
    const form = paymentFormFor(order);
    const amount = form.amount.trim() ? Number(form.amount) : null;
    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      mutation.setError("Payment amount must be zero or greater.");
      return;
    }

    let paidAt: string | null = null;
    if (form.paid_at) {
      const parsed = new Date(form.paid_at);
      if (Number.isNaN(parsed.getTime())) {
        mutation.setError("Paid at is not a valid date.");
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

    const updated = await mutation.run(
      `${order.id}:payment`,
      () => apiFetch<AdminOrder>(`/api/v1/admin/orders/${order.id}/payment`, { method: "PUT", body: JSON.stringify(body) }),
      "Payment updated.",
    );
    if (updated) {
      replaceOrder(updated);
      setPaymentForms((current) => ({ ...current, [order.id]: { ...form, note: "" } }));
    }
  };

  const addNote = async (order: AdminOrder) => {
    const note = noteDrafts[order.id]?.trim() ?? "";
    if (!note) {
      mutation.setError("Enter a note before submitting.");
      return;
    }
    const updated = await mutation.run(
      `${order.id}:note`,
      () =>
        apiFetch<AdminOrder>(`/api/v1/admin/orders/${order.id}/notes`, {
          method: "POST",
          body: JSON.stringify({ note }),
        }),
      "Note added.",
    );
    if (updated) {
      replaceOrder(updated);
      setNoteDrafts((current) => ({ ...current, [order.id]: "" }));
    }
  };

  const saveDetails = async (order: AdminOrder) => {
    const form = detailsFormFor(order);
    const optional = (value: string) => value.trim() || null;
    const body = {
      customer_name: form.customer_name.trim(),
      customer_email: form.customer_email.trim(),
      customer_phone: optional(form.customer_phone),
      business_name: optional(form.business_name),
      project_requirements: optional(form.project_requirements),
      additional_instructions: optional(form.additional_instructions),
      tracking_id: optional(form.tracking_id),
      delivery_info: optional(form.delivery_info),
    };
    const updated = await mutation.run(
      `${order.id}:details`,
      () => apiFetch<AdminOrder>(`/api/v1/admin/orders/${order.id}/details`, { method: "PUT", body: JSON.stringify(body) }),
      "Order details saved.",
    );
    if (updated) replaceOrder(updated);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    await updateOrderStatus(cancelTarget, "cancelled", "Order cancelled.");
    setCancelTarget(null);
  };

  const exportCsv = () => {
    const header = ["Order ID", "Order number", "Tracking ID", "Customer", "Email", "Product", "Order status", "Payment status", "Amount", "Currency", "Created"];
    const rows = filteredOrders.map((order) => [
      order.id,
      order.order_number,
      order.tracking_id,
      order.customer_name,
      order.customer_email,
      order.product_name_snapshot,
      order.order_status,
      order.payment_status,
      order.amount ?? "",
      order.currency,
      order.created_at,
    ]);
    const content = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const printInvoice = () => {
    document.body.classList.add("printing-invoice");
    window.print();
    window.setTimeout(() => document.body.classList.remove("printing-invoice"), 500);
  };

  if (loading) return <AdminLoadingBlock label="Loading orders" />;
  if (error) return <AdminErrorBlock message={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <AdminBanner message={mutation.success} tone="success" onDismiss={mutation.clearMessages} />
      <AdminBanner message={mutation.error} tone="error" onDismiss={mutation.clearMessages} />

      <AdminPanel
        title="Order queue"
        description="Filter by order number, tracking ID, customer, status, payment state or creation date."
        action={
          <button type="button" onClick={exportCsv} className={buttonSecondaryClass}>
            <Download size={15} aria-hidden="true" /> Export CSV
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="xl:col-span-1">
            <span className={labelClass}>Search orders</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ID, tracking, customer"
              className={`${inputClass} mt-2`}
            />
          </label>
          <label>
            <span className={labelClass}>Order status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)} className={`${inputClass} mt-2`}>
              <option value="all">All statuses</option>
              {orderStatusOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label>
            <span className={labelClass}>Payment status</span>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value as "all" | PaymentStatus)} className={`${inputClass} mt-2`}>
              <option value="all">All payments</option>
              {paymentStatusOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label>
            <span className={labelClass}>From date</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className={`${inputClass} mt-2`} />
          </label>
          <label>
            <span className={labelClass}>To date</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className={`${inputClass} mt-2`} />
          </label>
        </div>
        <p className={`${noteClass} mt-4`}>{filteredOrders.length} of {orders.length} orders shown.</p>
      </AdminPanel>

      <AdminPanel title="Orders" description="Select an order to manage status, payment, notes, delivery details and invoice printing.">
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
          empty={<AdminEmptyBlock title="No orders found" description="Adjust the filters above or reload the order list." />}
          renderCell={(order, key) => {
            if (key === "order") {
              return (
                <div>
                  <p className="font-sans text-sm font-semibold text-[#000000]">{order.order_number}</p>
                  <p className="mt-1 font-sans text-[10px] text-[#666666]">{order.tracking_id || "No tracking ID"}</p>
                </div>
              );
            }
            if (key === "customer") {
              return (
                <div className="font-sans text-xs">
                  <p className="text-[#000000]">{order.customer_name}</p>
                  <p className="mt-1 text-[#666666]">{order.customer_email}</p>
                </div>
              );
            }
            if (key === "product") return <span className="font-sans text-xs text-[#444444]">{order.product_name_snapshot}</span>;
            if (key === "status") return <StatusBadge value={order.order_status} />;
            if (key === "payment") return <StatusBadge value={order.payment_status} />;
            if (key === "amount") return <span className="font-sans text-sm"><Money value={order.amount} currency={order.currency} /></span>;
            if (key === "created") return <DateText value={order.created_at} withTime />;
            return (
              <button
                type="button"
                onClick={() => { mutation.clearMessages(); setSelectedId(order.id); }}
                className="inline-flex min-h-9 items-center border border-[#000000] px-3 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#000000] transition-colors hover:border-[#B00020] hover:text-[#B00020]"
              >
                Manage
              </button>
            );
          }}
          renderCard={(order) => (
            <div className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-sm font-semibold text-[#000000]">{order.order_number}</p>
                  <p className="mt-1 font-sans text-[10px] text-[#666666]">{order.tracking_id || "No tracking ID"}</p>
                </div>
                <StatusBadge value={order.order_status} />
              </div>
              <div className="mt-4 grid gap-2 font-sans text-xs text-[#555555]">
                <p>{order.customer_name}</p>
                <p>{order.product_name_snapshot}</p>
                <p><Money value={order.amount} currency={order.currency} /></p>
                <p><DateText value={order.created_at} withTime /></p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => { mutation.clearMessages(); setSelectedId(order.id); }} className={buttonSecondaryClass}>Manage</button>
                <button type="button" onClick={() => void markPaid(order)} disabled={Boolean(mutation.busyKey)} className={buttonSuccessClass}>Mark paid</button>
                <button type="button" onClick={() => setCancelTarget(order)} className={buttonDangerClass}>Cancel</button>
              </div>
            </div>
          )}
        />
      </AdminPanel>

      {selectedOrder && (
        <div className="space-y-6">
          <AdminPanel
            title={`Order ${selectedOrder.order_number}`}
            description={`Tracking ID ${selectedOrder.tracking_id || "not set"} · Created ${new Date(selectedOrder.created_at).toLocaleString("en-GB")}`}
            action={
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={printInvoice} className={buttonSecondaryClass}><Printer size={15} aria-hidden="true" /> Print invoice</button>
                <button type="button" onClick={() => setSelectedId(null)} className={buttonSecondaryClass}>Close</button>
              </div>
            }
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <KeyValue label="Customer">{selectedOrder.customer_name}</KeyValue>
              <KeyValue label="Email">{selectedOrder.customer_email}</KeyValue>
              <KeyValue label="Phone">{selectedOrder.customer_phone || "—"}</KeyValue>
              <KeyValue label="Business">{selectedOrder.business_name ?? "—"}</KeyValue>
              <KeyValue label="Order status"><StatusBadge value={selectedOrder.order_status} /></KeyValue>
              <KeyValue label="Payment status"><StatusBadge value={selectedOrder.payment_status} /></KeyValue>
              <KeyValue label="Tracking ID">{selectedOrder.tracking_id ?? "—"}</KeyValue>
              <KeyValue label="Delivery info">{selectedOrder.delivery_info ?? "—"}</KeyValue>
              <KeyValue label="Project requirements">{selectedOrder.project_requirements ?? "—"}</KeyValue>
              <KeyValue label="Additional instructions">{selectedOrder.additional_instructions ?? "—"}</KeyValue>
              <KeyValue label="Admin notes">{selectedOrder.admin_notes ?? "—"}</KeyValue>
              <KeyValue label="Amount"><Money value={selectedOrder.amount} currency={selectedOrder.currency} /></KeyValue>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-[#E5E5E5] pt-5">
              <button type="button" onClick={() => void updateOrderStatus(selectedOrder, "confirmed", "Order confirmed.")} disabled={Boolean(mutation.busyKey)} className={buttonSuccessClass}>Confirm</button>
              <button type="button" onClick={() => void markPaid(selectedOrder)} disabled={Boolean(mutation.busyKey)} className={buttonSuccessClass}>Mark paid</button>
              <button type="button" onClick={() => void updateOrderStatus(selectedOrder, "completed", "Order marked as shipped.")} disabled={Boolean(mutation.busyKey)} className={buttonSuccessClass}>Ship</button>
              <button type="button" onClick={() => void updateOrderStatus(selectedOrder, "under_review", "Order moved to review.")} disabled={Boolean(mutation.busyKey)} className={buttonWarningClass}>Review</button>
              <button type="button" onClick={() => void updateOrderStatus(selectedOrder, "pending", "Order moved to pending.")} disabled={Boolean(mutation.busyKey)} className={buttonWarningClass}>Pending</button>
              <button type="button" onClick={() => setCancelTarget(selectedOrder)} className={buttonDangerClass}>Cancel order</button>
            </div>

            <div className="mt-6 border-t border-[#E5E5E5] pt-5">
              <p className={labelClass}>Order items</p>
              {selectedOrder.items?.length ? (
                <ul className="mt-3 space-y-2">
                  {selectedOrder.items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 font-sans text-xs">
                      <span className="text-[#000000]">{item.product_name_snapshot} · Qty {item.quantity}</span>
                      <span className="text-[#444444]"><Money value={item.line_total} currency={selectedOrder.currency} /></span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`${noteClass} mt-2`}>No items were returned for this order.</p>
              )}
            </div>
          </AdminPanel>

          <AdminPanel title="Customer and delivery details" description="Updates are sent with PUT /api/v1/admin/orders/{id}/details.">
            <div className="grid gap-4 md:grid-cols-2">
              {(["customer_name", "customer_email", "customer_phone", "business_name", "tracking_id"] as const).map((field) => (
                <label key={field}>
                  <span className={labelClass}>{field.replaceAll("_", " ")}</span>
                  <input
                    value={detailsFormFor(selectedOrder)[field]}
                    onChange={(event) => setDetailsForms((current) => ({
                      ...current,
                      [selectedOrder.id]: { ...detailsFormFor(selectedOrder), [field]: event.target.value },
                    }))}
                    className={`${inputClass} mt-2`}
                  />
                </label>
              ))}
              {(["project_requirements", "additional_instructions", "delivery_info"] as const).map((field) => (
                <label key={field} className="md:col-span-2">
                  <span className={labelClass}>{field.replaceAll("_", " ")}</span>
                  <textarea
                    rows={3}
                    value={detailsFormFor(selectedOrder)[field]}
                    onChange={(event) => setDetailsForms((current) => ({
                      ...current,
                      [selectedOrder.id]: { ...detailsFormFor(selectedOrder), [field]: event.target.value },
                    }))}
                    className={`${textareaClass} mt-2`}
                  />
                </label>
              ))}
            </div>
            <button type="button" onClick={() => void saveDetails(selectedOrder)} disabled={mutation.busyKey === `${selectedOrder.id}:details`} className={`${buttonPrimaryClass} mt-5`}>
              {mutation.busyKey === `${selectedOrder.id}:details` ? "Saving" : "Save details"}
            </button>
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
                    {orderStatusOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
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
                  onClick={() => void updateOrderStatus(selectedOrder, orderStatusFor(selectedOrder))}
                  disabled={mutation.busyKey === `${selectedOrder.id}:status`}
                  className={buttonPrimaryClass}
                >
                  {mutation.busyKey === `${selectedOrder.id}:status` ? "Updating" : "Update status"}
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
                    {paymentStatusOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}
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
                  onClick={() => void updatePayment(selectedOrder)}
                  disabled={mutation.busyKey === `${selectedOrder.id}:payment`}
                  className={`${buttonPrimaryClass} sm:col-span-2`}
                >
                  {mutation.busyKey === `${selectedOrder.id}:payment` ? "Updating" : "Update payment"}
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
                onClick={() => void addNote(selectedOrder)}
                disabled={mutation.busyKey === `${selectedOrder.id}:note`}
                className={`${buttonSecondaryClass} mt-4`}
              >
                {mutation.busyKey === `${selectedOrder.id}:note` ? "Adding" : "Add note"}
              </button>
            </AdminPanel>

            <AdminPanel title="Status timeline" description="History returned with the admin order record.">
              {selectedOrder.status_history?.length ? (
                <ol className="space-y-3">
                  {selectedOrder.status_history.map((entry) => (
                    <li key={entry.id} className="border-l border-[#B00020] pl-4">
                      <p className="font-sans text-xs text-[#000000]">
                        {entry.from_status ? `${entry.from_status} → ` : ""}{entry.to_status}
                      </p>
                      <p className="mt-1 font-sans text-[10px] text-[#666666]"><DateText value={entry.created_at} withTime /></p>
                      {entry.note && <p className="mt-1 font-sans text-xs text-[#444444]">{entry.note}</p>}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={noteClass}>No status history has been recorded for this order.</p>
              )}
            </AdminPanel>
          </div>

          <AdminPanel title="Payments on this order" description="Payment records returned with the order. No placeholder payments are generated.">
            {selectedOrder.payments?.length ? (
              <ul className="space-y-2">
                {selectedOrder.payments.map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3">
                    <div className="font-sans text-xs">
                      <p className="text-[#000000]"><Money value={payment.amount} currency={payment.currency} /></p>
                      <p className="mt-1 text-[#666666]">{payment.provider ?? "No provider"} · <DateText value={payment.created_at} withTime /></p>
                    </div>
                    <StatusBadge value={payment.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className={noteClass}>No payments are recorded for this order.</p>
            )}
          </AdminPanel>

          <section className="admin-print-only admin-invoice-print border border-[#E2E2E2] bg-[#FFFFFF] p-8 text-[#000000]">
            <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[#000000] pb-5">
              <div>
                <p className="font-condense text-2xl tracking-[0.18em]">KAMORA</p>
                <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.18em]">Invoice / {selectedOrder.order_number}</p>
              </div>
              <div className="font-sans text-xs text-right">
                <p>Tracking ID: {selectedOrder.tracking_id || "—"}</p>
                <p>Created: <DateText value={selectedOrder.created_at} withTime /></p>
                <p>Status: {selectedOrder.order_status.replaceAll("_", " ")}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666]">Bill to</p>
                <p className="mt-2 font-sans text-sm">{selectedOrder.customer_name}</p>
                <p className="font-sans text-xs text-[#444444]">{selectedOrder.customer_email}</p>
                <p className="font-sans text-xs text-[#444444]">{selectedOrder.customer_phone}</p>
                {selectedOrder.business_name && <p className="font-sans text-xs text-[#444444]">{selectedOrder.business_name}</p>}
              </div>
              <div>
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#666666]">Delivery</p>
                <p className="mt-2 font-sans text-xs text-[#444444]">{selectedOrder.delivery_info ?? "Delivery details not recorded."}</p>
              </div>
            </div>
            <table className="mt-8 w-full border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-[#000000]">
                  <th className="py-2 text-left">Item</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(selectedOrder.items?.length ? selectedOrder.items : []).map((item) => (
                  <tr key={item.id} className="border-b border-[#E2E2E2]">
                    <td className="py-2">{item.product_name_snapshot}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right"><Money value={item.line_total} currency={selectedOrder.currency} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-6 flex justify-end border-t border-[#000000] pt-4">
              <p className="font-sans text-sm font-semibold">Total: <Money value={selectedOrder.amount} currency={selectedOrder.currency} /></p>
            </div>
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel order"
        message={`Cancel order ${cancelTarget?.order_number ?? ""}? This changes the order status to cancelled.`}
        confirmLabel="Cancel order"
        busy={Boolean(mutation.busyKey)}
        onConfirm={() => void confirmCancel()}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
