"use client";

import { LoaderCircle } from "lucide-react";
import { RatingStars } from "@/components/reviews/RatingStars";
import { formatDate, type ApiReview, type ReviewSort } from "@/lib/commerce";

type ReviewListProps = {
  slug: string;
  reviews: ApiReview[];
  total: number;
  sort: ReviewSort;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  onSortChange: (sort: ReviewSort) => void;
  onLoadMore: () => void;
};

export function ReviewList({
  slug,
  reviews,
  total,
  sort,
  loading,
  loadingMore,
  error,
  onSortChange,
  onLoadMore,
}: ReviewListProps) {
  const hasMore = reviews.length < total;

  return (
    <div className="border border-paper/10 bg-paper/[0.02] p-6 sm:p-8">
      <div className="flex flex-col gap-4 border-b border-paper/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">What clients say</p>
          <h3 className="mt-2 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">
            Reviews{total > 0 ? ` (${total})` : ""}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor={`review-sort-${slug}`} className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-faint">
            Sort by
          </label>
          <select
            id={`review-sort-${slug}`}
            value={sort}
            onChange={(event) => onSortChange(event.target.value as ReviewSort)}
            className="min-h-10 border border-white/15 bg-white/[0.02] px-3 py-2 font-sans text-xs text-paper-pure transition-colors focus:border-brass focus:outline-none"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest</option>
            <option value="lowest">Lowest</option>
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-6 border border-brass/60 bg-brass/[0.08] px-4 py-3 font-sans text-xs text-paper-pure">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 font-sans text-xs text-paper-faint" role="status">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="mt-6 font-sans text-sm leading-relaxed text-paper-dim/75">
          No reviews have been published for this product yet.
        </p>
      ) : (
        <div className="divide-y divide-paper/10">
          {reviews.map((review) => (
            <article key={review.id} className="py-6 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <RatingStars
                    value={review.rating}
                    variant="compact"
                    label={`${review.user_name} rated this product ${review.rating} out of 5 stars`}
                  />
                  <span className="font-sans text-[11px] text-paper-faint">{formatDate(review.created_at)}</span>
                  {review.is_updated && (
                    <span className="border border-paper/20 px-2 py-0.5 font-sans text-[9px] uppercase tracking-[0.14em] text-paper-faint">
                      Updated
                    </span>
                  )}
                </div>
                <span className="font-sans text-xs font-medium text-paper-pure">{review.user_name}</span>
              </div>
              {review.review_text.trim() && (
                <p className="mt-3 text-sm leading-relaxed text-paper-dim/85">{review.review_text.trim()}</p>
              )}
            </article>
          ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-paper/10 pt-6">
          <p className="font-sans text-[11px] text-paper-faint">
            Showing {reviews.length} of {total}
          </p>
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="inline-flex min-h-10 items-center justify-center gap-2 border border-paper/30 px-5 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-pure transition-colors hover:border-brass hover:bg-brass focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore && <LoaderCircle size={14} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
            {loadingMore ? "Loading" : "Load more reviews"}
          </button>
        </div>
      )}
    </div>
  );
}
