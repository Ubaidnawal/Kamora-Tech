"use client";

import { ArrowLeft, ArrowUpRight, Building2, ClipboardList, FileText, Mail, Phone, RefreshCw, StickyNote, UserRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import {
  errorMessage,
  formatDate,
  formatDateTime,
  formatMoney,
  humanizeStatus,
  statusClass,
  type ApiOrder,
} from "@/lib/commerce";

export function OrderDetailView({ id }: { id: string }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<ApiOrder>(`/api/v1/orders/${encodeURIComponent(id)}`);
      setOrder(data);
    } catch (value) {
      setOrder(null);
      setError(errorMessage(value, "We couldn't load this order. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, isAuthenticated, load, reloadKey]);

  const timeline = useMemo(
    () =>
      [...(order?.status_history ?? [])].sort((a, b) => {
        const first = new Date(a.created_at).getTime();
        const second = new Date(b.created_at).getTime();
        return (Number.isNaN(first) ? 0 : first) - (Number.isNaN(second) ? 0 : second);
      }),
    [order],
  );

  if (authLoading || loading) {
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-16 text-center">
          <span className="h-10 w-10 animate-spin border border-brass border-t-transparent" aria-hidden="true" />
          <p className="mt-8 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-paper-faint">
            Loading order details
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center border border-brass/40 text-brass">
            <ClipboardList size={26} strokeWidth={1.3} aria-hidden="true" />
          </span>
          <h2 className="mt-8 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Log in to view this order</h2>
          <p className="body-copy mt-4 text-center">Order details are only available to the account that submitted them.</p>
          <Link href="/login/" className="btn-primary mt-8">Log in</Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div role="alert" className="border border-brass/60 bg-brass/[0.08] px-5 py-4 font-sans text-xs leading-relaxed text-paper-pure">
          <p>{error || "Order not found."}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.16em] text-brass">
              <RefreshCw size={14} aria-hidden="true" />
              Try again
            </button>
            <Link href="/orders/" className="font-semibold uppercase tracking-[0.16em] text-paper-dim transition-colors hover:text-brass">
              Back to orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-7 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/orders/" className="inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-faint transition-colors hover:text-brass">
              <ArrowLeft size={14} aria-hidden="true" />
              Back to orders
            </Link>
            <p className="mt-6 font-condense text-xs tracking-[0.2em] text-brass">{order.order_number}</p>
            <h2 className="mt-2 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure sm:text-3xl">
              {order.product_name_snapshot}
            </h2>
            <p className="mt-2 font-sans text-[11px] text-paper-faint">Placed {formatDateTime(order.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] ${statusClass(order.order_status)}`}>
              {humanizeStatus(order.order_status)}
            </span>
            <span className={`border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] ${statusClass(order.payment_status)}`}>
              Payment: {humanizeStatus(order.payment_status)}
            </span>
          </div>
        </div>

        <div className="mt-7 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3">
          <div className="bg-background p-5">
            <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Tracking ID</p>
            <p className="mt-2 break-all font-condense text-xl tracking-wide text-brass">{order.tracking_id}</p>
          </div>
          <div className="bg-background p-5">
            <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Order total</p>
            <p className="mt-2 font-condense text-2xl text-paper-pure">{formatMoney(order.amount, order.currency)}</p>
          </div>
          <div className="bg-background p-5">
            <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Last updated</p>
            <p className="mt-2 font-sans text-sm text-paper-pure">{formatDateTime(order.updated_at ?? order.created_at)}</p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/track/" className="btn-outline">
            Track publicly
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <Link href="/orders/" className="inline-flex min-h-13 items-center justify-center border border-white/15 px-7 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim transition-colors hover:border-brass hover:text-brass">
            All orders
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="border border-white/10 bg-surface p-6 sm:p-8">
          <p className="eyebrow">Order items</p>
          <h3 className="mt-3 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">Requested solutions</h3>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-white/10 font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">
                  <th className="py-3 pr-4 font-semibold">Solution</th>
                  <th className="py-3 pr-4 text-center font-semibold">Qty</th>
                  <th className="py-3 pr-4 text-right font-semibold">Unit</th>
                  <th className="py-3 text-right font-semibold">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {(order.items ?? []).map((item) => (
                  <tr key={item.id} className="text-paper-pure">
                    <td className="py-4 pr-4">{item.product_name_snapshot}</td>
                    <td className="py-4 pr-4 text-center font-condense text-lg">{item.quantity}</td>
                    <td className="py-4 pr-4 text-right">{formatMoney(item.unit_price, order.currency)}</td>
                    <td className="py-4 text-right font-condense text-lg text-brass">{formatMoney(item.line_total ?? item.unit_price, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(order.items ?? []).length === 0 && <p className="py-8 text-center font-sans text-xs text-paper-faint">No line items returned.</p>}
          </div>
        </section>

        <section className="border border-white/10 bg-surface p-6 sm:p-8">
          <p className="eyebrow">Customer</p>
          <h3 className="mt-3 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">Contact information</h3>
          <ul className="mt-6 space-y-4 font-sans text-sm text-paper-pure">
            <li className="flex items-start gap-3"><UserRound size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />{order.customer_name}</li>
            <li className="flex items-start gap-3"><Mail size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" /><a href={`mailto:${order.customer_email}`} className="break-all hover:text-brass">{order.customer_email}</a></li>
            <li className="flex items-start gap-3"><Phone size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />{order.customer_phone}</li>
            <li className="flex items-start gap-3"><Building2 size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />{order.business_name || "No business name provided"}</li>
          </ul>
        </section>
      </div>

      <section className="border border-white/10 bg-surface p-6 sm:p-8">
        <p className="eyebrow">Project brief</p>
        <h3 className="mt-3 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">What you asked for</h3>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="border border-white/10 bg-background p-5">
            <p className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">
              <FileText size={14} aria-hidden="true" className="text-brass" />
              Project requirements
            </p>
            <p className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-paper-pure">
              {order.project_requirements || "No project requirements were provided."}
            </p>
          </div>
          <div className="border border-white/10 bg-background p-5">
            <p className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">
              <StickyNote size={14} aria-hidden="true" className="text-brass" />
              Additional instructions
            </p>
            <p className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-paper-pure">
              {order.additional_instructions || "No additional instructions were provided."}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="border border-white/10 bg-surface p-6 sm:p-8">
          <p className="eyebrow">Progress</p>
          <h3 className="mt-3 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">Status timeline</h3>
          {timeline.length === 0 ? (
            <p className="mt-6 font-sans text-sm text-paper-dim">No status history has been returned for this order yet.</p>
          ) : (
            <ol className="mt-7 space-y-0">
              {timeline.map((entry, index) => (
                <li key={entry.id} className="grid grid-cols-[28px_minmax(0,1fr)] gap-4">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 flex h-3 w-3 items-center justify-center rounded-full border border-brass bg-brass" />
                    {index < timeline.length - 1 && <span className="mt-2 h-full w-px bg-brass/40" />}
                  </div>
                  <div className="pb-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-sans text-sm font-semibold text-paper-pure">{humanizeStatus(entry.to_status)}</span>
                      {entry.from_status && <span className="font-sans text-[11px] text-paper-faint">from {humanizeStatus(entry.from_status)}</span>}
                    </div>
                    <p className="mt-1 font-sans text-[11px] text-paper-faint">{formatDateTime(entry.created_at)}</p>
                    {entry.note && <p className="mt-2 font-sans text-sm leading-relaxed text-paper-dim">{entry.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <div className="space-y-6">
          <section className="border border-white/10 bg-surface p-6 sm:p-8">
            <p className="eyebrow">Admin notes</p>
            <h3 className="mt-3 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">Internal updates</h3>
            <p className="mt-6 whitespace-pre-wrap font-sans text-sm leading-relaxed text-paper-dim">
              {order.admin_notes || "No admin notes have been added to this order."}
            </p>
          </section>

          <section className="border border-white/10 bg-surface p-6 sm:p-8">
            <p className="eyebrow">Payments</p>
            <h3 className="mt-3 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">Payment records</h3>
            {(order.payments ?? []).length === 0 ? (
              <p className="mt-6 font-sans text-sm text-paper-dim">No payment has been recorded for this request.</p>
            ) : (
              <ul className="mt-6 divide-y divide-white/10">
                {(order.payments ?? []).map((payment) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="font-sans text-sm text-paper-pure">{humanizeStatus(payment.status)}</p>
                      <p className="mt-1 font-sans text-[11px] text-paper-faint">
                        {formatDate(payment.paid_at ?? payment.created_at)}{payment.provider ? ` · ${payment.provider}` : ""}
                      </p>
                    </div>
                    <p className="font-condense text-xl text-brass">{formatMoney(payment.amount, payment.currency || order.currency)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
