"use client";

import { ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { errorMessage, formatDateTime, humanizeStatus, statusClass, type ApiTrackOrder } from "@/lib/commerce";

function TrackFallback() {
  return (
    <div className="border border-white/10 bg-surface p-6 sm:p-10">
      <p className="font-sans text-xs text-paper-dim">Preparing order tracking...</p>
    </div>
  );
}

function TrackViewContent() {
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState(() => searchParams.get("identifier")?.trim() ?? "");
  const [result, setResult] = useState<ApiTrackOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = identifier.trim();
    if (!value) {
      setError("Enter an order ID, tracking ID, or internal order ID to continue.");
      return;
    }
    if (value.length < 3 || value.length > 64) {
      setError("That ID must be between 3 and 64 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await apiFetch<ApiTrackOrder>(`/api/v1/orders/track?identifier=${encodeURIComponent(value)}`);
      setResult(data);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setError("We couldn't find an order matching that ID. Check the number and try again.");
        return;
      }
      setError(errorMessage(error, "We couldn't check that order right now. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError("");
    setIdentifier("");
  };

  const timeline = result && Array.isArray(result.timeline) ? result.timeline : [];

  return (
    <div className="space-y-6">
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="max-w-2xl">
          <p className="eyebrow">Public tracking</p>
          <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Find your order status.</h2>
          <p className="body-copy mt-4">
            Enter the order ID, tracking ID, or internal order ID from your confirmation. Only public status and timeline information is displayed here.
          </p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <label className="flex-1 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim">
              Order ID / tracking ID
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="mt-2 min-h-13 w-full border border-white/15 bg-background px-4 py-3 font-condense text-lg tracking-wide text-paper-pure outline-none transition-colors placeholder:font-sans placeholder:text-xs placeholder:tracking-normal placeholder:text-paper-faint/60 focus:border-brass"
                placeholder="Order number, tracking ID, or order ID"
                autoComplete="off"
              />
            </label>
            <button type="submit" disabled={loading} className="btn-primary mt-2 self-start disabled:cursor-not-allowed disabled:opacity-60 sm:mt-8">
              <Search size={16} aria-hidden="true" />
              {loading ? "Searching…" : "Track order"}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div role="alert" className="border border-brass/60 bg-brass/[0.08] px-5 py-4 font-sans text-xs leading-relaxed text-paper-pure">
          {error}
        </div>
      )}

      {result && (
        <div className="border border-white/10 bg-surface p-6 sm:p-10">
          <div className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Tracking result</p>
              <h3 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">{result.order_number}</h3>
              <p className="mt-2 font-condense text-lg tracking-wide text-brass">{result.tracking_id}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] ${statusClass(result.order_status)}`}>
                {humanizeStatus(result.order_status)}
              </span>
              <span className={`border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] ${statusClass(result.payment_status)}`}>
                Payment: {humanizeStatus(result.payment_status)}
              </span>
            </div>
          </div>

          <div className="mt-7 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
            <div className="bg-background p-5">
              <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Created</p>
              <p className="mt-2 font-sans text-sm text-paper-pure">{formatDateTime(result.created_at)}</p>
            </div>
            <div className="bg-background p-5">
              <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Last updated</p>
              <p className="mt-2 font-sans text-sm text-paper-pure">{formatDateTime(result.updated_at ?? result.created_at)}</p>
            </div>
          </div>

          <div className="mt-10">
            <p className="eyebrow">Public timeline</p>
            {timeline.length === 0 ? (
              <p className="mt-5 font-sans text-sm text-paper-dim">No public timeline updates have been recorded yet.</p>
            ) : (
              <ol className="mt-7">
                {timeline.map((entry, index) => (
                  <li key={entry.id} className="grid grid-cols-[28px_minmax(0,1fr)] gap-4">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 flex h-3 w-3 items-center justify-center rounded-full border border-brass bg-brass" />
                      {index < timeline.length - 1 && <span className="mt-2 h-full w-px bg-brass/40" />}
                    </div>
                    <div className="pb-8">
                      <p className="font-sans text-sm font-semibold text-paper-pure">{humanizeStatus(entry.to_status)}</p>
                      <p className="mt-1 font-sans text-[11px] text-paper-faint">{formatDateTime(entry.created_at)}</p>
                      {entry.note && <p className="mt-2 font-sans text-sm leading-relaxed text-paper-dim">{entry.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-7">
            <button type="button" onClick={reset} className="btn-outline">Track another order</button>
            <Link href="/orders/" className="inline-flex min-h-13 items-center justify-center gap-2 px-7 py-4 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim transition-colors hover:text-brass">
              <ArrowLeft size={15} aria-hidden="true" />
              My orders
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function TrackView() {
  return (
    <Suspense fallback={<TrackFallback />}>
      <TrackViewContent />
    </Suspense>
  );
}
