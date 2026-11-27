"use client";

import { useCallback, useState } from "react";

export function useAdminMutation() {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  const run = useCallback(async <T,>(key: string, task: () => Promise<T>, message: string): Promise<T | null> => {
    setBusyKey(key);
    setError("");
    setSuccess("");
    try {
      const result = await task();
      setSuccess(message);
      return result;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The action could not be completed.");
      return null;
    } finally {
      setBusyKey(null);
    }
  }, []);

  return { busyKey, error, success, setError, setSuccess, clearMessages, run };
}
