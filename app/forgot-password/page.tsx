"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AccountPageShell } from "@/components/account/AccountPageShell";
import { apiFetch, ApiError } from "@/lib/api";

type Notice = { tone: "error" | "success"; text: string };
type MessageResponse = { message: string; token?: string | null; link?: string | null };
type DevDetails = { token: string | null; link: string | null };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const submitClass =
  "btn-primary group w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-brass";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [devDetails, setDevDetails] = useState<DevDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
      setEmailError("Enter a valid address, for example name@company.com.");
      return;
    }

    setEmailError(null);
    setLoading(true);
    setNotice(null);
    setDevDetails(null);
    try {
      const result = await apiFetch<MessageResponse>("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail }),
      });
      setNotice({ tone: "success", text: result.message });
      if (result.token || result.link) {
        setDevDetails({ token: result.token ?? null, link: result.link ?? null });
      }
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error, "We couldn't process your request. Please try again.") });
    } finally {
      setLoading(false);
    }
  };

  const resetHref = devDetails?.token ? `/reset-password/?token=${encodeURIComponent(devDetails.token)}` : null;

  return (
    <AccountPageShell
      number="04"
      label="Password reset"
      pageName="Forgot password"
      title="Reset access."
      description="Request a password reset link for the email address linked to your Kamora Tech account."
    >
      <form onSubmit={onSubmit} noValidate className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="mb-8 border-b border-white/10 pb-6">
          <p className="eyebrow">Account recovery</p>
          <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Forgot your password?</h2>
        </div>

        <div className="space-y-6">
          {notice && (
            <div role={notice.tone === "error" ? "alert" : "status"} className={`border px-4 py-3 font-sans text-xs leading-relaxed ${
              notice.tone === "error"
                ? "border-brass/60 bg-brass/[0.08] text-paper-pure"
                : "border-brass/40 bg-brass/[0.06] text-paper-pure"
            }`}>
              {notice.text}
            </div>
          )}

          {devDetails && (
            <div className="border border-brass/60 bg-brass/[0.08] p-5">
              <p className="eyebrow">Development only</p>
              <p className="mt-3 font-sans text-xs leading-relaxed text-paper-dim">
                The backend returned a reset token because email delivery is not configured. Do not use this outside local development.
              </p>
              {resetHref && (
                <Link href={resetHref} className="link-underline mt-4 inline-block break-all font-sans text-xs text-brass">
                  Open password reset link
                </Link>
              )}
              {devDetails.link && (
                <p className="mt-4 break-all font-sans text-[11px] leading-relaxed text-paper-faint">
                  Backend link: <span className="text-brass">{devDetails.link}</span>
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">
              Email address <span className="text-brass">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="alex@company.com"
              value={email}
              onChange={(event) => { setEmail(event.target.value); setEmailError(null); }}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "email-error" : undefined}
              required
              className={`mt-2 min-h-12 w-full border bg-white/[0.02] px-4 py-3 text-sm text-paper-pure placeholder:text-paper-faint/70 transition-colors duration-200 focus:border-brass focus:outline-none ${
                emailError ? "border-brass" : "border-white/15"
              }`}
            />
            {emailError && <p id="email-error" role="alert" className="mt-2 text-xs text-paper-pure">{emailError}</p>}
          </div>

          <button type="submit" disabled={loading} className={submitClass}>
            {loading ? <LoaderCircle size={17} aria-hidden="true" className="animate-spin" /> : null}
            {loading ? "Sending request" : "Send reset link"}
          </button>

          {notice?.tone === "success" && (
            <Link href="/login/" className="link-underline inline-block font-sans text-xs text-brass">
              Return to log in
            </Link>
          )}

          <p className="font-sans text-xs leading-relaxed text-paper-faint">
            Remembered it? <Link href="/login/" className="link-underline text-brass">Log in</Link>
          </p>
        </div>
      </form>
    </AccountPageShell>
  );
}
