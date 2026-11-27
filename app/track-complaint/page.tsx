"use client";

import { ArrowRight, LoaderCircle, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { apiFetch } from "@/lib/api";
import { formatDateTime } from "@/lib/commerce";
import type { ComplaintTrackResponse } from "@/lib/complaints";

export default function TrackComplaintPage() {
  const [trackingId, setTrackingId] = useState("");
  const [query, setQuery] = useState("");
  const [complaint, setComplaint] = useState<ComplaintTrackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = new URLSearchParams(window.location.search).get("id") ?? "";
    if (id) {
      setTrackingId(id);
      setQuery(id);
      void lookup(id);
    }
  }, []);

  const lookup = async (id: string) => {
    const value = id.trim();
    if (!value) {
      setError("Enter your tracking ID to look up a complaint.");
      return;
    }
    setLoading(true);
    setError("");
    setComplaint(null);
    try {
      const result = await apiFetch<ComplaintTrackResponse>(`/api/v1/complaints/track/${encodeURIComponent(value)}`, { skipCsrf: true });
      setComplaint(result);
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : "We couldn't find a complaint with that tracking ID.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void lookup(query);
  };

  return (
    <>
      <PageHero
        number="08"
        label="Track complaint"
        pageName="Track complaint"
        lines={[
          { text: "Follow your", className: "text-paper-pure" },
          { text: "case status.", className: "text-outline-brass" },
        ]}
        description="Enter the tracking ID from your complaint confirmation to see its current status and public progress timeline."
        meta={[
          { value: "Private", label: "ID-only lookup" },
          { value: "Live", label: "Status from our team" },
          { value: "Clear", label: "Public timeline only" },
        ]}
      />

      <section className="bg-background py-20 lg:py-28">
        <div className="site-container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow">Complaint lookup</p>
            <h2 className="mt-5 font-title text-3xl font-medium uppercase tracking-wide text-paper-pure">Check your case.</h2>
            <p className="body-copy mt-6">
              Your tracking ID was shown after you submitted the complaint. Internal team notes are never displayed here.
            </p>
            <div className="mt-10 flex items-start gap-4 border border-brass/25 bg-brass/[0.04] p-6">
              <ShieldCheck size={20} strokeWidth={1.4} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />
              <p className="text-sm leading-relaxed text-paper-dim">
                Only the tracking ID is required. No account or password is needed to view the public status.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <form onSubmit={onSubmit} className="border border-white/10 bg-surface p-6 sm:p-10">
              <label htmlFor="tracking-id" className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">Tracking ID</label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <input
                  id="tracking-id"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Enter your complaint tracking ID"
                  className="min-h-12 w-full border border-white/15 bg-white/[0.02] px-4 py-3 font-mono text-sm text-paper-pure placeholder:text-paper-faint/70 focus:border-brass focus:outline-none"
                />
                <button type="submit" disabled={loading} className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? <LoaderCircle size={16} aria-hidden="true" className="animate-spin" /> : <Search size={16} aria-hidden="true" />}
                  Track
                </button>
              </div>
              {error && <p role="alert" className="mt-4 border border-brass/60 bg-brass/[0.08] px-4 py-3 font-sans text-xs text-paper-pure">{error}</p>}
            </form>

            {loading && (
              <div className="mt-8 border border-white/10 bg-surface p-10 text-center text-sm text-paper-dim">Loading complaint status…</div>
            )}

            {complaint && (
              <div className="mt-8 space-y-6">
                <div className="border border-brass/30 bg-surface p-6 sm:p-8">
                  <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-paper-faint">Tracking ID</p>
                  <p className="mt-2 break-all font-condense text-2xl tracking-[0.08em] text-brass">{complaint.tracking_id}</p>
                  <h3 className="mt-6 font-title text-2xl uppercase tracking-wide text-paper-pure">{complaint.subject}</h3>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Status", value: complaint.status.replaceAll("_", " ") },
                      { label: "Category", value: complaint.category },
                      { label: "Priority", value: complaint.priority },
                      { label: "Submitted", value: formatDateTime(complaint.created_at) },
                      { label: "Last updated", value: formatDateTime(complaint.updated_at) },
                      { label: "Resolved", value: complaint.resolved_at ? formatDateTime(complaint.resolved_at) : "Not yet" },
                    ].map((item) => (
                      <div key={item.label} className="border-t border-white/10 pt-3">
                        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-faint">{item.label}</p>
                        <p className="mt-1 font-sans text-sm capitalize text-paper-pure">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-white/10 bg-surface p-6 sm:p-8">
                  <h3 className="font-title text-xl uppercase tracking-wide text-paper-pure">Public timeline</h3>
                  {complaint.timeline?.length ? (
                    <ol className="mt-7 space-y-6">
                      {complaint.timeline.map((entry) => (
                        <li key={entry.id} className="border-l-2 border-brass pl-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="font-sans text-sm font-semibold capitalize text-paper-pure">
                              {entry.previous_status ? `${entry.previous_status.replaceAll("_", " ")} → ` : ""}{entry.new_status.replaceAll("_", " ")}
                            </p>
                            <p className="font-sans text-[10px] text-paper-faint">{formatDateTime(entry.created_at)}</p>
                          </div>
                          {entry.message && <p className="mt-2 text-sm leading-relaxed text-paper-dim">{entry.message}</p>}
                          {entry.changed_by_role && (
                            <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.14em] text-brass">{entry.changed_by_role}</p>
                          )}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-5 text-sm text-paper-dim">No status changes have been recorded yet.</p>
                  )}
                </div>

                <a href="/complain/" className="inline-flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-brass">
                  Submit another complaint <ArrowRight size={14} aria-hidden="true" />
                </a>
              </div>
            )}

            {!loading && !complaint && !error && trackingId && (
              <p className="mt-6 text-sm text-paper-dim">Looking up complaint {trackingId}…</p>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
