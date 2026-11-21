"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { REVIEWS_UPDATED_EVENT } from "@/components/reviews/RatingSummariesProvider";
import { apiFetch } from "@/lib/api";
import {
  errorMessage,
  type ApiReview,
  type ApiReviewList,
  type ApiReviewSummary,
  type ReviewSort,
} from "@/lib/commerce";

const PAGE_SIZE = 5;

export function ProductReviews({ slug }: { slug: string }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<ApiReviewSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [listLoading, setListLoading] = useState(true);
  const [listMoreLoading, setListMoreLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [myReview, setMyReview] = useState<ApiReview | null>(null);
  const [myReviewLoading, setMyReviewLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const listRequestId = useRef(0);

  const buildListUrl = useCallback(
    (targetSort: ReviewSort, targetPage: number) =>
      `/api/v1/products/${encodeURIComponent(slug)}/reviews?sort=${targetSort}&page=${targetPage}&page_size=${PAGE_SIZE}`,
    [slug],
  );

  const refreshAll = useCallback(() => {
    setRefreshKey((current) => current + 1);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(REVIEWS_UPDATED_EVENT, { detail: { slug } }));
    }
  }, [slug]);

  useEffect(() => {
    let active = true;
    setSummaryLoading(true);
    setSummaryError(null);

    apiFetch<ApiReviewSummary>(`/api/v1/products/${encodeURIComponent(slug)}/reviews/summary`, { skipCsrf: true })
      .then((data) => {
        if (!active) return;
        setSummary(data);
      })
      .catch((caught) => {
        if (!active) return;
        setSummary(null);
        setSummaryError(errorMessage(caught, "Unable to load ratings."));
      })
      .finally(() => {
        if (active) setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, refreshKey]);

  useEffect(() => {
    const id = ++listRequestId.current;
    setListLoading(true);
    setListError(null);
    setListMoreLoading(false);

    apiFetch<ApiReviewList>(buildListUrl(sort, 1), { skipCsrf: true })
      .then((data) => {
        if (id !== listRequestId.current) return;
        setReviews(data.items ?? []);
        setTotal(data.total ?? 0);
        setPage(data.page ?? 1);
      })
      .catch((caught) => {
        if (id !== listRequestId.current) return;
        setReviews([]);
        setTotal(0);
        setListError(errorMessage(caught, "Unable to load reviews."));
      })
      .finally(() => {
        if (id === listRequestId.current) setListLoading(false);
      });

    return () => {
      listRequestId.current += 1;
    };
  }, [buildListUrl, sort, refreshKey]);

  useEffect(() => {
    if (authLoading) {
      setMyReviewLoading(true);
      return;
    }
    if (!isAuthenticated) {
      setMyReview(null);
      setMyReviewLoading(false);
      return;
    }

    let active = true;
    setMyReviewLoading(true);

    apiFetch<ApiReview | null>(`/api/v1/products/${encodeURIComponent(slug)}/reviews/me`, { skipCsrf: true })
      .then((data) => {
        if (active) setMyReview(data ?? null);
      })
      .catch(() => {
        if (active) setMyReview(null);
      })
      .finally(() => {
        if (active) setMyReviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authLoading, isAuthenticated, refreshKey, slug]);

  const loadMore = async () => {
    if (listLoading || listMoreLoading || reviews.length >= total) return;

    const id = listRequestId.current;
    const nextPage = page + 1;
    setListMoreLoading(true);
    setListError(null);

    try {
      const data = await apiFetch<ApiReviewList>(buildListUrl(sort, nextPage), { skipCsrf: true });
      if (id !== listRequestId.current) return;
      setReviews((current) => [...current, ...(data.items ?? [])]);
      setTotal(data.total ?? total);
      setPage(data.page ?? nextPage);
    } catch (caught) {
      if (id === listRequestId.current) setListError(errorMessage(caught, "Unable to load more reviews."));
    } finally {
      if (id === listRequestId.current) setListMoreLoading(false);
    }
  };

  return (
    <section id="reviews" className="border-t border-white/10 bg-background py-20 lg:py-28">
      <div className="site-container">
        <div className="mb-10 flex flex-col gap-5 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Ratings &amp; reviews</p>
            <h2 className="section-title mt-5 text-paper-pure">What clients are saying.</h2>
          </div>
          <p className="max-w-xl text-[13px] leading-relaxed text-paper-dim/60">
            Ratings and written feedback from signed-in clients who have used this solution.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <div className="space-y-6">
            <RatingSummary summary={summary} loading={summaryLoading} error={summaryError} />
            <ReviewForm
              slug={slug}
              myReview={myReview}
              myReviewLoading={myReviewLoading}
              onSubmitted={refreshAll}
            />
          </div>
          <ReviewList
            slug={slug}
            reviews={reviews}
            total={total}
            sort={sort}
            loading={listLoading}
            loadingMore={listMoreLoading}
            error={listError}
            onSortChange={setSort}
            onLoadMore={loadMore}
          />
        </div>
      </div>
    </section>
  );
}
