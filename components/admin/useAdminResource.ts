"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";

export function useAdminResource<T>(path: string | null) {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const reload = useCallback(() => setRevision((value) => value + 1), []);

  const effectivePath = isAdmin ? path : null;

  useEffect(() => {
    let active = true;

    if (!effectivePath) {
      setData(null);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    apiFetch<T>(effectivePath)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught: unknown) => {
        if (!active) return;
        setError(caught instanceof Error ? caught.message : "The request could not be completed.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [effectivePath, revision]);

  return { data, setData, loading, error, reload };
}
