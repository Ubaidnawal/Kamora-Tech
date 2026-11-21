"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AccountPageShell } from "@/components/account/AccountPageShell";
import { apiFetch, ApiError } from "@/lib/api";

type VerifyState = "pending" | "success" | "error";
type MessageResponse = { message: string };

let autoVerifiedToken: string | null = null;

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const detail = (error.data as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string" && detail) return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .flatMap((item) => {
          if (typeof item === "string") return [item];
          if (item && typeof item === "object" && "msg" in item) return [String((item as { msg?: unknown }).msg ?? "")];
          return [];
        })
        .filter(Boolean);
      if (messages.length) return messages.join(" ");
    }
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function FormFallback() {
  return (
    <div className="border border-white/10 bg-surface p-6 sm:p-10">
      <p className="font-sans text-xs text-paper-dim">Preparing email verification...</p>
    </div>
  );
}

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [state, setState] = useState<VerifyState>(token ? "pending" : "error");
  const [message, setMessage] = useState(token ? "Verifying your email..." : "This verification link is missing a token.");

  const verify = useCallback(async () => {
    if (!token) {
      setState("error");
      setMessage("This verification link is missing a token.");
      return;
    }

    setState("pending");
    setMessage("Verifying your email...");
    try {
      const result = await apiFetch<MessageResponse>("/api/v1/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setState("success");
      setMessage(result.message || "Email verified successfully.");
    } catch (error) {
      setState("error");
      setMessage(errorMessage(error, "We couldn't verify your email. Please try again."));
    }
  }, [token]);

  useEffect(() => {
    if (!token || autoVerifiedToken === token) return;
    autoVerifiedToken = token;
    void verify();
  }, [token, verify]);

  return (
    <div className="border border-white/10 bg-surface p-6 sm:p-10">
      <div className="mb-8 border-b border-white/10 pb-6">
        <p className="eyebrow">Email verification</p>
        <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Confirm your address.</h2>
      </div>

      <div className="space-y-6">
        <div
          role={state === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`border px-4 py-3 font-sans text-xs leading-relaxed ${
            state === "error"
              ? "border-brass/60 bg-brass/[0.08] text-paper-pure"
              : "border-brass/40 bg-brass/[0.06] text-paper-pure"
          }`}
        >
          {message}
        </div>

        {state === "pending" && (
          <p className="inline-flex items-center gap-3 font-sans text-xs text-paper-dim">
            <LoaderCircle size={17} aria-hidden="true" className="animate-spin" />
            Please wait.
          </p>
        )}

        {state === "error" && (
          <button type="button" onClick={verify} disabled={!token} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
            Try again
          </button>
        )}

        {state === "success" && (
          <Link href="/login/" className="btn-primary w-full">
            Continue to log in
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AccountPageShell
      number="06"
      label="Verify email"
      pageName="Verify email"
      title="Verify your email."
      description="Confirm the address linked to your Kamora Tech account using the token from your verification link."
    >
      <Suspense fallback={<FormFallback />}>
        <VerifyEmailForm />
      </Suspense>
    </AccountPageShell>
  );
}
