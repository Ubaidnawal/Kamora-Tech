"use client";

import { ArrowUpRight, ClipboardList, RefreshCw, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import { errorMessage, formatDate, formatMoney, humanizeStatus, statusClass, type ApiOrder } from "@/lib/commerce";

type LoadState = "idle" | "loading" | "ready" | "error";

export function OrdersPanel() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [message, setMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      const data = await apiFetch<ApiOrder[]>("/api/v1/orders");
      setOrders(Array.isArray(data) ? data : []);
      setState("ready");
    } catch (error) {
      setMessage(errorMessage(error, "We couldn't load your orders. Please try again."));
      setState("error");
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setState("idle");
      setOrders([]);
      return;
    }
    void load();
  }, [authLoading, isAuthenticated, load, reloadKey]);

  if (authLoading) {
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-16 text-center">
          <span className="h-10 w-10 animate-spin border border-brass border-t-transparent" aria-hidden="true" />
          <p className="mt-8 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-paper-faint">
            Checking your session
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center border border-brass/40 text-brass">
            <ClipboardList size={26} strokeWidth={1.3} aria-hidden="true" />
          </span>
          <h2 className="mt-8 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Log in to view orders</h2>
          <p className="body-copy mt-4 text-center">Your session is required to load orders belonging to your account.</p>
          <Link href="/login/" className="btn-primary mt-8">Log in</Link>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div role="alert" className="border border-brass/60 bg-brass/[0.08] px-5 py-4 font-sans text-xs leading-relaxed text-paper-pure">
          <p>{message}</p>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-4 inline-flex items-center gap-2 font-semibold uppercase tracking-[0.16em] text-brass">
            <RefreshCw size={14} aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (state === "ready" && orders.length === 0) {
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center border border-white/15 text-brass">
            <ShoppingBag size={26} strokeWidth={1.3} aria-hidden="true" />
          </span>
          <h2 className="mt-8 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">No orders yet</h2>
          <p className="body-copy mt-4 text-center">When you submit an order request, its details and current status will appear here.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/#products" className="btn-primary">Browse products</Link>
            <Link href="/cart/" className="btn-outline">View cart</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-surface p-6 sm:p-10">
      <div className="mb-8 flex items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <p className="eyebrow">Your orders</p>
          <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Order history</h2>
        </div>
        <span className="font-condense text-sm tracking-widest text-paper-faint">
          {state === "loading" ? "Loading" : `${orders.length.toString().padStart(2, "0")} total`}
        </span>
      </div>

      {state === "loading" ? (
        <p className="py-16 text-center font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-paper-faint">Loading your orders</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="border border-white/10 bg-white/[0.015] p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-condense text-xs tracking-[0.2em] text-brass">{order.order_number}</p>
                  <h3 className="mt-2 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">{order.product_name_snapshot}</h3>
                  <p className="mt-1 font-sans text-[11px] text-paper-faint">
                    {formatDate(order.created_at)} · Tracking {order.tracking_id}
                  </p>
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

              <div className="mt-6 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-2">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Items</p>
                  {order.items && order.items.length > 0 ? (
                    <ul className="mt-2 space-y-1 font-sans text-sm text-paper-pure">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between gap-4">
                          <span>{item.product_name_snapshot} × {item.quantity}</span>
                          <span className="font-condense text-base">{formatMoney(item.line_total ?? item.unit_price, order.currency)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 font-sans text-sm text-paper-pure">No line items returned.</p>
                  )}
                </div>
                <div className="sm:text-right">
                  <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Order total</p>
                  <p className="mt-2 font-condense text-2xl text-brass">{formatMoney(order.amount, order.currency)}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                <Link href={`/orders/${order.id}/`} className="inline-flex min-h-11 items-center gap-2 border border-brass px-4 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass transition-colors hover:bg-brass hover:text-paper-pure">
                  View details
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
                <Link href="/track/" className="inline-flex min-h-11 items-center gap-2 border border-white/15 px-4 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim transition-colors hover:border-brass hover:text-brass">
                  Track order
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
