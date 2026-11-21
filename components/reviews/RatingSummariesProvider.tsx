"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { errorMessage, type ApiReviewSummary } from "@/lib/commerce";

export const REVIEWS_UPDATED_EVENT = "kamora:reviews-updated";

type RatingSummariesContextValue = {
  summaries: Record<string, ApiReviewSummary>;
  loading: boolean;
  error: string | null;
  getSummary: (slug: string) => ApiReviewSummary | undefined;
  refresh: () => Promise<void>;
};

const RatingSummariesContext = createContext<RatingSummariesContextValue | null>(null);

export function RatingSummariesProvider({ slugs, children }: { slugs: string[]; children: ReactNode }) {
  const slugKey = useMemo(() => Array.from(new Set(slugs.filter(Boolean))).sort().join(","), [slugs]);
  const requestId = useRef(0);
  const [summaries, setSummaries] = useState<Record<string, ApiReviewSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    const id = ++requestId.current;

    if (!slugKey) {
      setSummaries({});
      setError(null);
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    try {
      const data = await apiFetch<Record<string, ApiReviewSummary>>(
        `/api/v1/products/reviews/summaries?slugs=${encodeURIComponent(slugKey)}`,
        { skipCsrf: true },
      );
      if (id !== requestId.current) return;
      setSummaries(data && typeof data === "object" ? data : {});
      setError(null);
    } catch (caught) {
      if (id !== requestId.current) return;
      setError(errorMessage(caught, "Unable to load ratings."));
      if (!silent) setSummaries((current) => (Object.keys(current).length ? current : {}));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [slugKey]);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUpdated = () => {
      void load(true);
    };
    window.addEventListener(REVIEWS_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(REVIEWS_UPDATED_EVENT, onUpdated);
  }, [load]);

  const getSummary = useCallback((slug: string) => summaries[slug], [summaries]);

  const value = useMemo<RatingSummariesContextValue>(
    () => ({ summaries, loading, error, getSummary, refresh: () => load() }),
    [error, getSummary, load, loading, summaries],
  );

  return <RatingSummariesContext.Provider value={value}>{children}</RatingSummariesContext.Provider>;
}

export function useRatingSummaries() {
  const context = useContext(RatingSummariesContext);
  if (!context) throw new Error("useRatingSummaries must be used inside RatingSummariesProvider");
  return context;
}
