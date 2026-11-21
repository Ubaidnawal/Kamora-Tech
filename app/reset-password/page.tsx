"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AccountPageShell } from "@/components/account/AccountPageShell";
import { apiFetch, ApiError } from "@/lib/api";

type Notice = { tone: "error" | "success"; text: string };
type Errors = Record<string, string | undefined>;
type MessageResponse = { message: string };

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

const fieldClass = (error?: string) =>
  `mt-2 min-h-12 w-full border bg-white/[0.02] px-4 py-3 text-sm text-paper-pure placeholder:text-paper-faint/70 transition-colors duration-200 focus:border-brass focus:outline-none ${
    error ? "border-brass" : "border-white/15"
  }`;

const submitClass =
  "btn-primary group w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-brass";

function ResetPasswordField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">
        {label} <span className="text-brass">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          placeholder={id === "password" ? "At least 8 characters" : "Repeat your password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          required
          className={`${fieldClass(error)} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-paper-faint transition-colors hover:text-brass"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-paper-pure">{error}</p>}
    </div>
  );
}

function FormFallback() {
  return (
    <div className="border border-white/10 bg-surface p-6 sm:p-10">
      <p className="font-sans text-xs text-paper-dim">Preparing password reset form...</p>
    </div>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (): Errors => {
    const next: Errors = {};
    if (!token) next.token = "This reset link is missing a token. Request a new link.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      next.password = "Use upper and lower case letters and at least one number.";
    }
    if (confirmPassword !== password) next.confirmPassword = "Passwords do not match.";
    return next;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setNotice(null);
    try {
      const result = await apiFetch<MessageResponse>("/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password, confirm_password: confirmPassword }),
      });
      setSuccess(true);
      setNotice({ tone: "success", text: result.message || "Password reset successfully." });
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error, "We couldn't reset your password. Please try again.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="border border-white/10 bg-surface p-6 sm:p-10">
      <div className="mb-8 border-b border-white/10 pb-6">
        <p className="eyebrow">Choose a new password</p>
        <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Secure your account.</h2>
      </div>

      <div className="space-y-6">
        {!token && (
          <div role="alert" className="border border-brass/60 bg-brass/[0.08] px-4 py-3 font-sans text-xs leading-relaxed text-paper-pure">
            This reset link is missing a token. <Link href="/forgot-password/" className="link-underline text-brass">Request a new link</Link>.
          </div>
        )}
        {errors.token && <p role="alert" className="text-xs text-paper-pure">{errors.token}</p>}
        {notice && (
          <div role={notice.tone === "error" ? "alert" : "status"} className={`border px-4 py-3 font-sans text-xs leading-relaxed ${
            notice.tone === "error"
              ? "border-brass/60 bg-brass/[0.08] text-paper-pure"
              : "border-brass/40 bg-brass/[0.06] text-paper-pure"
          }`}>
            {notice.text}
          </div>
        )}

        <ResetPasswordField
          id="password"
          label="New password"
          value={password}
          onChange={(value) => { setPassword(value); setErrors((current) => ({ ...current, password: undefined })); }}
          error={errors.password}
        />
        <ResetPasswordField
          id="confirmPassword"
          label="Confirm new password"
          value={confirmPassword}
          onChange={(value) => { setConfirmPassword(value); setErrors((current) => ({ ...current, confirmPassword: undefined })); }}
          error={errors.confirmPassword}
        />

        <p className="font-sans text-[11px] leading-relaxed text-paper-faint">
          Use at least 8 characters with upper and lower case letters and a number.
        </p>

        <button type="submit" disabled={loading || !token || success} className={submitClass}>
          {loading ? <LoaderCircle size={17} aria-hidden="true" className="animate-spin" /> : null}
          {loading ? "Resetting password" : "Reset password"}
        </button>

        {success && (
          <Link href="/login/" className="link-underline inline-block font-sans text-xs text-brass">
            Continue to log in
          </Link>
        )}
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AccountPageShell
      number="05"
      label="New password"
      pageName="Reset password"
      title="Choose a new password."
      description="Use the token from your password reset link to set a new password for your Kamora Tech account."
    >
      <Suspense fallback={<FormFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </AccountPageShell>
  );
}
