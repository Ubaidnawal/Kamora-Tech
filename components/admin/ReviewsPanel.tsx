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
  PaginationControls,
  RatingBadge,
  ResponsiveTable,
  StatusBadge,
} from "./AdminPrimitives";
import {
  buttonInfoClass,
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
import type { AdminReview, AdminReviewList } from "./types";
import { useAdminMutation } from "./useAdminMutation";
import { useAdminResource } from "./useAdminResource";

const PAGE_SIZE = 10;

type EditState = {
  id: string;
  rating: string;
  review_text: string;
};

export function ReviewsPanel() {
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState("all");
  const [approved, setApproved] = useState("all");
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const mutation = useAdminMutation();

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(queryInput), 300);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    setPage(1);
  }, [query, rating, approved]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    if (query.trim()) params.set("search", query.trim());
    if (rating !== "all") params.set("rating", rating);
    if (approved !== "all") params.set("approved", approved);
    return `/api/v1/admin/reviews?${params.toString()}`;
  }, [approved, page, query, rating]);

  const { data, setData, loading, error, reload } = useAdminResource<AdminReviewList>(path);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const replaceReview = (updated: AdminReview) => {
    setData((current) =>
      current
        ? { ...current, items: current.items.map((item) => (item.id === updated.id ? updated : item)) }
        : current,
    );
  };

  const setApproval = async (review: AdminReview, isApproved: boolean, message: string) => {
    const updated = await mutation.run(
      `${review.id}:approval`,
      () => apiFetch<AdminReview>(`/api/v1/admin/reviews/${review.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_approved: isApproved }),
      }),
      message,
    );
    if (updated) {
      replaceReview(updated);
    }
  };

  const saveEdit = async () => {
    if (!edit) return;
    const numericRating = Number(edit.rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      mutation.setError("Rating must be a whole number between 1 and 5.");
      return;
    }
    if (edit.review_text.trim().length < 3) {
      mutation.setError("Review text must contain at least three characters.");
      return;
    }

    const updated = await mutation.run(
      `${edit.id}:edit`,
      () => apiFetch<AdminReview>(`/api/v1/admin/reviews/${edit.id}`, {
        method: "PATCH",
        body: JSON.stringify({ rating: numericRating, review_text: edit.review_text.trim() }),
      }),
      "Review updated.",
    );
    if (updated) {
      replaceReview(updated);
      setEdit(null);
    }
  };

  const deleteReview = async () => {
    if (!deleteTarget) return;
    const result = await mutation.run(
      `${deleteTarget.id}:delete`,
      () => apiFetch<{ message?: string }>(`/api/v1/admin/reviews/${deleteTarget.id}`, { method: "DELETE" }),
      resultMessage(deleteTarget),
    );
    if (result) {
      setDeleteTarget(null);
      reload();
    }
  };

  const openEdit = (review: AdminReview) => {
    mutation.clearMessages();
    setEdit({ id: review.id, rating: String(review.rating), review_text: review.review_text ?? "" });
  };

  if (loading) return <AdminLoadingBlock label="Loading reviews" />;
  if (error) return <AdminErrorBlock message={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <AdminBanner message={mutation.success} tone="success" onDismiss={mutation.clearMessages} />
      <AdminBanner message={mutation.error} tone="error" onDismiss={mutation.clearMessages} />

      <AdminPanel title="Review filters" description="Search and filter reviews returned by the admin reviews endpoint.">
        <div className="grid gap-4 md:grid-cols-3">
          <label>
            <span className={labelClass}>Search</span>
            <input
              type="search"
              value={queryInput}
              onChange={(event) => setQueryInput(event.target.value)}
              placeholder="Product, customer, email or review text"
              className={`${inputClass} mt-2`}
            />
          </label>
          <label>
            <span className={labelClass}>Rating</span>
            <select value={rating} onChange={(event) => setRating(event.target.value)} className={`${inputClass} mt-2`}>
              <option value="all">All ratings</option>
              {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}
            </select>
          </label>
          <label>
            <span className={labelClass}>Status</span>
            <select value={approved} onChange={(event) => setApproved(event.target.value)} className={`${inputClass} mt-2`}>
              <option value="all">All reviews</option>
              <option value="true">Approved</option>
              <option value="false">Pending approval</option>
            </select>
          </label>
        </div>
      </AdminPanel>

      <AdminPanel title="Customer reviews" description={`${total} review records returned by the API.`}>
        <ResponsiveTable
          columns={[
            { key: "product", label: "Product" },
            { key: "customer", label: "Customer" },
            { key: "rating", label: "Rating" },
            { key: "review", label: "Review" },
            { key: "status", label: "Status" },
            { key: "created", label: "Created" },
            { key: "actions", label: "Actions" },
          ]}
          rows={items}
          rowKey={(item) => item.id}
          empty={<AdminEmptyBlock title="No reviews found" description="Adjust the filters or reload the review list." />}
          renderCell={(item, key) => {
            if (key === "product") {
              return (
                <div>
                  <p className="font-sans text-sm font-semibold text-[#000000]">{item.product_name ?? "Product"}</p>
                  <p className="mt-1 font-sans text-[10px] text-[#666666]">{item.product_slug ?? ""}</p>
                </div>
              );
            }
            if (key === "customer") {
              return (
                <div className="font-sans text-xs">
                  <p className="text-[#000000]">{item.user_name ?? "Customer"}</p>
                  <p className="mt-1 text-[#666666]">{item.user_email ?? ""}</p>
                </div>
              );
            }
            if (key === "rating") return <RatingBadge value={item.rating} />;
            if (key === "review") {
              return <p className="max-w-md line-clamp-2 font-sans text-xs leading-relaxed text-[#444444]">{item.review_text}</p>;
            }
            if (key === "status") return <StatusBadge value={item.is_approved ? "approved" : "pending"} />;
            if (key === "created") return <DateText value={item.created_at} withTime />;
            return <ReviewActions item={item} mutation={mutation} onEdit={openEdit} onDelete={setDeleteTarget} onApproval={setApproval} />;
          }}
          renderCard={(item) => (
            <div className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-sm font-semibold text-[#000000]">{item.product_name ?? "Product"}</p>
                  <p className="mt-1 font-sans text-[11px] text-[#666666]">{item.user_name ?? "Customer"} · <DateText value={item.created_at} /></p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RatingBadge value={item.rating} />
                  <StatusBadge value={item.is_approved ? "approved" : "pending"} />
                </div>
              </div>
              <p className="mt-3 font-sans text-xs leading-relaxed text-[#444444]">{item.review_text}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ReviewActions item={item} mutation={mutation} onEdit={openEdit} onDelete={setDeleteTarget} onApproval={setApproval} />
              </div>
            </div>
          )}
        />
        <PaginationControls page={data?.page ?? page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </AdminPanel>

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/50 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-review-title">
          <div className="w-full max-w-lg border border-[#E2E2E2] bg-[#FFFFFF] p-6 shadow-xl">
            <h3 id="edit-review-title" className="font-title text-lg font-medium uppercase tracking-wide text-[#000000]">Edit review</h3>
            <div className="mt-5 grid gap-4">
              <label>
                <span className={labelClass}>Rating</span>
                <select value={edit.rating} onChange={(event) => setEdit((current) => (current ? { ...current, rating: event.target.value } : current))} className={`${inputClass} mt-2`}>
                  {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} stars</option>)}
                </select>
              </label>
              <label>
                <span className={labelClass}>Review text</span>
                <textarea rows={5} value={edit.review_text} onChange={(event) => setEdit((current) => (current ? { ...current, review_text: event.target.value } : current))} className={`${textareaClass} mt-2`} />
              </label>
            </div>
            <p className={`${noteClass} mt-3`}>Changes are sent with PATCH /api/v1/admin/reviews/{edit.id}.</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setEdit(null)} className={buttonSecondaryClass}>Cancel</button>
              <button type="button" onClick={() => void saveEdit()} disabled={mutation.busyKey === `${edit.id}:edit`} className={buttonPrimaryClass}>
                {mutation.busyKey === `${edit.id}:edit` ? "Saving" : "Save review"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete review"
        message={`Delete the review by ${deleteTarget?.user_name ?? "this customer"}? This action cannot be undone.`}
        confirmLabel="Delete review"
        busy={Boolean(deleteTarget && mutation.busyKey === `${deleteTarget.id}:delete`)}
        onConfirm={() => void deleteReview()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function resultMessage(review: AdminReview) {
  return `Review by ${review.user_name ?? "customer"} deleted.`;
}

type ReviewActionsProps = {
  item: AdminReview;
  mutation: ReturnType<typeof useAdminMutation>;
  onEdit: (review: AdminReview) => void;
  onDelete: (review: AdminReview) => void;
  onApproval: (review: AdminReview, approved: boolean, message: string) => Promise<void>;
};

function ReviewActions({ item, mutation, onEdit, onDelete, onApproval }: ReviewActionsProps) {
  const key = `${item.id}:approval`;
  const busy = mutation.busyKey === key;
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy} onClick={() => void onApproval(item, true, "Review approved.")} className={buttonSuccessClass}>
        Approve
      </button>
      <button type="button" disabled={busy} onClick={() => void onApproval(item, false, "Review rejected.")} className={buttonWarningClass}>
        Reject
      </button>
      <button type="button" disabled={busy} onClick={() => void onApproval(item, true, "Review published.")} className={buttonInfoClass}>
        Publish
      </button>
      <button type="button" onClick={() => onEdit(item)} className={buttonSecondaryClass}>Edit</button>
      <button type="button" onClick={() => onDelete(item)} disabled={mutation.busyKey === `${item.id}:delete`} className={buttonSecondaryClass}>Delete</button>
    </div>
  );
}
