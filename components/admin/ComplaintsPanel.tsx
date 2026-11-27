"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  complaintCategories,
  complaintStatuses,
  type ComplaintAdminDetail,
  type ComplaintAdminList,
} from "@/lib/complaints";
import {
  AdminBanner,
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  ConfirmDialog,
  DateText,
  KeyValue,
  PaginationControls,
  ResponsiveTable,
  StatusBadge,
} from "./AdminPrimitives";
import {
  buttonInfoClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  inputClass,
  labelClass,
  noteClass,
  textareaClass,
} from "./adminStyles";
import { useAdminMutation } from "./useAdminMutation";
import { useAdminResource } from "./useAdminResource";

const PAGE_SIZE = 10;

export function ComplaintsPanel() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState("");
  const [publicMessage, setPublicMessage] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [closeTarget, setCloseTarget] = useState(false);
  const mutation = useAdminMutation();

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(queryInput), 300);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    setPage(1);
  }, [query, status, category]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ skip: String((page - 1) * PAGE_SIZE), limit: String(PAGE_SIZE) });
    if (query.trim()) params.set("search", query.trim());
    if (status !== "all") params.set("status", status);
    if (category !== "all") params.set("category", category);
    return `/api/v1/admin/complaints?${params.toString()}`;
  }, [category, page, query, status]);

  const list = useAdminResource<ComplaintAdminList>(path);
  const detail = useAdminResource<ComplaintAdminDetail | null>(selectedId ? `/api/v1/admin/complaints/${selectedId}` : null);

  useEffect(() => {
    if (!detail.data) return;
    setStatusDraft(detail.data.status ?? "new");
    setAdminNote(detail.data.admin_note ?? detail.data.internal_note ?? "");
    setPublicMessage("");
  }, [detail.data]);

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const selected = detail.data;

  const patchDetail = async (body: Record<string, unknown>, message: string) => {
    if (!selectedId) return null;
    const updated = await mutation.run(
      `${selectedId}:patch`,
      () => apiFetch<ComplaintAdminDetail>(`/api/v1/admin/complaints/${selectedId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
      message,
    );
    if (updated) {
      detail.setData(updated);
      list.reload();
    }
    return updated;
  };

  const updateStatus = async () => {
    if (!statusDraft) return;
    const body: Record<string, unknown> = { status: statusDraft };
    if (publicMessage.trim()) body.message = publicMessage.trim();
    if (adminNote.trim()) body.admin_note = adminNote.trim();
    await patchDetail(body, "Complaint updated.");
    setPublicMessage("");
  };

  const saveNote = async () => {
    if (!adminNote.trim()) {
      mutation.setError("Enter an internal note before saving.");
      return;
    }
    await patchDetail({ admin_note: adminNote.trim() }, "Internal note saved.");
  };

  const closeComplaint = async () => {
    await patchDetail({ status: "closed", message: publicMessage.trim() || "Complaint closed by administrator.", admin_note: adminNote.trim() || undefined }, "Complaint closed.");
    setCloseTarget(false);
  };

  if (list.loading) return <AdminLoadingBlock label="Loading complaints" />;
  if (list.error) return <AdminErrorBlock message={list.error} onRetry={list.reload} />;

  return (
    <div className="space-y-6">
      <AdminBanner message={mutation.success} tone="success" onDismiss={mutation.clearMessages} />
      <AdminBanner message={mutation.error} tone="error" onDismiss={mutation.clearMessages} />

      <AdminPanel title="Complaint filters" description="Search by tracking ID, name or email, then filter by status and category.">
        <div className="grid gap-4 md:grid-cols-3">
          <label>
            <span className={labelClass}>Search</span>
            <input
              type="search"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Tracking ID, name or email"
              className={`${inputClass} mt-2`}
            />
          </label>
          <label>
            <span className={labelClass}>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${inputClass} mt-2`}>
              <option value="all">All statuses</option>
              {complaintStatuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label>
            <span className={labelClass}>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className={`${inputClass} mt-2`}>
              <option value="all">All categories</option>
              {complaintCategories.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>
      </AdminPanel>

      <AdminPanel title="Complaint queue" description={`${total} complaint records returned by the API.`}>
        <ResponsiveTable
          columns={[
            { key: "case", label: "Case" },
            { key: "customer", label: "Customer" },
            { key: "category", label: "Category" },
            { key: "priority", label: "Priority" },
            { key: "status", label: "Status" },
            { key: "created", label: "Created" },
            { key: "action", label: "" },
          ]}
          rows={items}
          rowKey={(item) => item.id}
          empty={<AdminEmptyBlock title="No complaints found" description="Adjust the filters above or reload the queue." />}
          renderCell={(item, key) => {
            if (key === "case") {
              return (
                <div>
                  <p className="font-sans text-sm font-semibold text-[#000000]">{item.subject}</p>
                  <p className="mt-1 font-sans text-[10px] text-[#666666]">{item.tracking_id ?? item.id}</p>
                </div>
              );
            }
            if (key === "customer") {
              return (
                <div className="font-sans text-xs">
                  <p className="text-[#000000]">{item.full_name ?? "Customer"}</p>
                  <p className="mt-1 text-[#666666]">{item.email ?? ""}</p>
                </div>
              );
            }
            if (key === "category") return <span className="font-sans text-xs text-[#444444]">{item.category}</span>;
            if (key === "priority") return <StatusBadge value={item.priority ?? "normal"} />;
            if (key === "status") return <StatusBadge value={item.status ?? "new"} tone="info" />;
            if (key === "created") return <DateText value={item.created_at} withTime />;
            return (
              <button type="button" onClick={() => { mutation.clearMessages(); setSelectedId(item.id); }} className={buttonInfoClass}>
                Open case
              </button>
            );
          }}
          renderCard={(item) => (
            <div className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-sm font-semibold text-[#000000]">{item.subject}</p>
                  <p className="mt-1 font-sans text-[10px] text-[#666666]">{item.tracking_id ?? item.id}</p>
                </div>
                <StatusBadge value={item.status ?? "new"} tone="info" />
              </div>
              <div className="mt-4 grid gap-2 font-sans text-xs text-[#555555]">
                <p>{item.full_name ?? "Customer"} · {item.email ?? ""}</p>
                <p>{item.category} · Priority {item.priority ?? "normal"}</p>
                <p><DateText value={item.created_at} withTime /></p>
              </div>
              <button type="button" onClick={() => { mutation.clearMessages(); setSelectedId(item.id); }} className={`${buttonInfoClass} mt-4 w-full`}>
                Open case
              </button>
            </div>
          )}
        />
        <PaginationControls page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </AdminPanel>

      {selectedId && (
        <div className="space-y-6">
          {detail.loading && <AdminLoadingBlock label="Loading complaint detail" />}
          {detail.error && <AdminErrorBlock message={detail.error} onRetry={detail.reload} />}
          {selected && (
            <>
              <AdminPanel
                title={`Case ${selected.tracking_id ?? selected.id}`}
                description={selected.subject}
                action={
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={detail.reload} className={buttonSecondaryClass}>Refresh</button>
                    <button type="button" onClick={() => setSelectedId(null)} className={buttonSecondaryClass}>Close</button>
                  </div>
                }
              >
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <KeyValue label="Status"><StatusBadge value={selected.status ?? "new"} tone="info" /></KeyValue>
                  <KeyValue label="Category">{selected.category}</KeyValue>
                  <KeyValue label="Priority"><StatusBadge value={selected.priority ?? "normal"} /></KeyValue>
                  <KeyValue label="Customer">{selected.full_name ?? "Customer"}</KeyValue>
                  <KeyValue label="Email">{selected.email ?? "—"}</KeyValue>
                  <KeyValue label="Created"><DateText value={selected.created_at} withTime /></KeyValue>
                </div>
                <div className="mt-5 border-t border-[#E5E5E5] pt-4">
                  <p className={labelClass}>Description</p>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-[#444444]">{selected.description ?? "No description was returned."}</p>
                </div>
              </AdminPanel>

              <div className="grid gap-6 xl:grid-cols-2">
                <AdminPanel title="Update complaint" description="Public status changes and messages are sent to the admin complaint endpoint.">
                  <div className="grid gap-4">
                    <label>
                      <span className={labelClass}>Status</span>
                      <select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)} className={`${inputClass} mt-2`}>
                        {complaintStatuses.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className={labelClass}>Public message (optional)</span>
                      <textarea rows={3} value={publicMessage} onChange={(event) => setPublicMessage(event.target.value)} className={`${textareaClass} mt-2`} />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void updateStatus()} disabled={mutation.busyKey === `${selectedId}:patch`} className={buttonInfoClass}>
                        {mutation.busyKey === `${selectedId}:patch` ? "Updating" : "Update case"}
                      </button>
                      <button type="button" onClick={() => setCloseTarget(true)} disabled={mutation.busyKey === `${selectedId}:patch`} className={buttonSecondaryClass}>
                        Close case
                      </button>
                    </div>
                  </div>
                </AdminPanel>

                <AdminPanel title="Private admin note" description="Internal notes are for the team only and are never shown on public tracking.">
                  <label className="block">
                    <span className={labelClass}>Internal note</span>
                    <textarea rows={5} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} className={`${textareaClass} mt-2`} />
                  </label>
                  <button type="button" onClick={() => void saveNote()} disabled={mutation.busyKey === `${selectedId}:patch`} className={`${buttonPrimaryClass} mt-4`}>
                    Save note
                  </button>
                  <p className={`${noteClass} mt-3`}>PATCH body includes admin_note only; public timeline entries remain unchanged.</p>
                </AdminPanel>
              </div>

              <AdminPanel title="Public timeline" description="Status changes visible to the customer through the tracking page.">
                {selected.timeline?.length ? (
                  <ol className="space-y-4">
                    {selected.timeline.map((entry) => (
                      <li key={entry.id} className="border-l-2 border-[#1D4ED8] pl-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-sans text-sm font-semibold text-[#000000]">
                            {entry.previous_status ? `${entry.previous_status.replaceAll("_", " ")} → ` : ""}{entry.new_status.replaceAll("_", " ")}
                          </p>
                          <p className="font-sans text-[10px] text-[#666666]"><DateText value={entry.created_at} withTime /></p>
                        </div>
                        {entry.message && <p className="mt-1 font-sans text-xs leading-relaxed text-[#444444]">{entry.message}</p>}
                        {entry.changed_by_role && <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.12em] text-[#1D4ED8]">{entry.changed_by_role}</p>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <AdminEmptyBlock title="No timeline yet" description="Status changes will appear here once the case is updated." />
                )}
              </AdminPanel>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={closeTarget}
        title="Close complaint"
        message="Close this complaint case? The new status will be visible on the public tracking timeline."
        confirmLabel="Close case"
        tone="info"
        busy={Boolean(mutation.busyKey)}
        onConfirm={() => void closeComplaint()}
        onCancel={() => setCloseTarget(false)}
      />
    </div>
  );
}
