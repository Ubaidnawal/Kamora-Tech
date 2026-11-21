"use client";

import { Star } from "lucide-react";
import { RatingStars } from "@/components/reviews/RatingStars";
import { EMPTY_REVIEW_DISTRIBUTION, formatRating, type ApiReviewSummary } from "@/lib/commerce";

type RatingSummaryProps = {
  summary: ApiReviewSummary | null;
  loading: boolean;
  error: string | null;
};

export function RatingSummary({ summary, loading, error }: RatingSummaryProps) {
  const distribution = summary?.distribution ?? EMPTY_REVIEW_DISTRIBUTION;
  const count = summary?.review_count ?? 0;
  const average = summary?.average_rating ?? 0;
  const countText = count === 1 ? "1 review" : `${count} reviews`;

  return (
    <div className="border border-paper/10 bg-paper/[0.02] p-6 sm:p-8">
      <p className="eyebrow">Customer reviews</p>
      <div className="mt-6 flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-10">
        <div className="shrink-0 sm:w-44">
          <p className="font-display text-5xl leading-none tracking-tight text-paper-pure">
            {loading || error ? "—" : formatRating(summary?.average_rating)}
          </p>
          <RatingStars
            value={average}
            variant="large"
            label={error ? "Ratings unavailable" : `Average rating ${formatRating(summary?.average_rating)} out of 5 stars`}
            className="mt-4"
          />
          <p className="mt-3 font-sans text-[11px] uppercase tracking-[0.14em] text-paper-faint">
            {error ? "Ratings unavailable" : loading ? "Loading ratings" : count > 0 ? countText : "No reviews yet"}
          </p>
        </div>

        <div className="w-full space-y-2.5 sm:border-l sm:border-paper/10 sm:pl-10">
          {[5, 4, 3, 2, 1].map((star) => {
            const value = distribution[String(star) as keyof typeof distribution] ?? 0;
            const percent = count > 0 ? (value / count) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3" aria-label={`${star} stars: ${value} reviews`}>
                <span className="w-3 shrink-0 font-sans text-[11px] text-paper-dim">{star}</span>
                <Star size={11} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brass" />
                <div className="h-1.5 flex-1 overflow-hidden bg-white/10">
                  <div
                    className="h-full bg-brass transition-[width] duration-500 ease-editorial motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-7 shrink-0 text-right font-sans text-[11px] text-paper-faint">{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
