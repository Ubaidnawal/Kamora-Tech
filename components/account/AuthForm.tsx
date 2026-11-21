"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch, ApiError } from "@/lib/api";

type Notice = { tone: "info" | "error" | "success"; text: string };
type Errors = Record<string, string | undefined>;
type VerificationState = { token: string; link: string | null; message: string };
type MessageResponse = { message: string; token?: string | null; link?: string | null };

type SignupValues = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
  accept_terms: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeInternalPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}
const initialSignupValues: SignupValues = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  accept_terms: false,
};

const fieldClass = (error?: string) =>
  `mt-2 min-h-12 w-full border bg-white/[0.02] px-4 py-3 text-sm text-paper-pure placeholder:text-paper-faint/70 transition-colors duration-200 focus:border-brass focus:outline-none ${
    error ? "border-brass" : "border-white/15"
  }`;

const signupFieldClass = (error?: string) =>
  `mt-2 min-h-12 w-full rounded-sm border bg-white/[0.02] px-4 py-3 text-sm text-paper-pure placeholder:text-paper-faint/70 transition-colors focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass ${
    error ? "border-brass" : "border-white/15"
  }`;

const labelClass = "font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim";

function friendlyMessage(raw: string) {
  const value = raw.toLowerCase();
  if (value.includes("failed to fetch") || value.includes("networkerror") || value.includes("load failed")) {
    return "Unable to connect to the server. Please try again.";
  }
  if (value.includes("already exists") || value.includes("already registered")) {
    return "This email is already registered.";
  }
  if (value.includes("password") || value.includes("uppercase") || value.includes("lowercase") || value.includes("digit")) {
    return "Password does not meet the requirements.";
  }
  if (value.includes("passwords do not match") || value.includes("passwords match")) {
    return "Passwords do not match.";
  }
  if (value.includes("terms") || value.includes("accept")) {
    return "Please accept the terms and conditions.";
  }
  if (value.includes("authentication is temporarily unavailable")) {
    return "Unable to sign in right now. Please try again.";
  }
  if (value.includes("temporarily unavailable") || value.includes("database") || value.includes("service unavailable")) {
    return "Registration is temporarily unavailable.";
  }
  if (value.includes("server could not complete")) {
    return "The server could not complete the request. Please try again.";
  }
  if (value.includes("field required") || value.includes("complete all required")) {
    return "Please complete all required fields.";
  }
  return raw;
}

function rawErrorMessage(error: unknown, fallback: string) {
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
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

function errorMessage(error: unknown, fallback: string) {
  return friendlyMessage(rawErrorMessage(error, fallback));
}

function signupErrorMessage(error: unknown, fallback: string) {
  const raw = rawErrorMessage(error, fallback);
  const value = raw.toLowerCase();
  if (value.includes("failed to fetch") || value.includes("networkerror") || value.includes("load failed")) {
    return "Unable to connect to the server. Please try again.";
  }
  if (value.includes("temporarily unavailable") || value.includes("database") || value.includes("service unavailable")) {
    return "Registration is temporarily unavailable. Please try again later.";
  }
  if (value.includes("please complete all required fields") || value.includes("field required")) {
    return "Please complete all required fields.";
  }
  if (value.includes("please enter a valid email address") || value.includes("value is not a valid email address")) {
    return "Please enter a valid email address.";
  }
  if (value.includes("passwords do not match") || value.includes("passwords match")) {
    return "Passwords do not match.";
  }
  if (value.includes("please accept the terms")) {
    return "Please accept the Terms and Conditions.";
  }
  if (value.includes("stronger password") || value.includes("password does not meet") || value.includes("uppercase") || value.includes("lowercase") || value.includes("digit") || value.includes("at least 8")) {
    return "Please enter a stronger password.";
  }
  if (value.includes("already exists") || value.includes("already registered")) {
    return "This email is already registered.";
  }
  return raw;
}

function StatusNotice({ tone, children }: { tone: Notice["tone"]; children: ReactNode }) {
  const toneClass =
    tone === "error"
      ? "border-brass/60 bg-brass/[0.08] text-paper-pure"
      : tone === "success"
        ? "border-brass/40 bg-brass/[0.06] text-paper-pure"
        : "border-white/15 bg-white/[0.03] text-paper-dim";

  return (
    <div role={tone === "error" ? "alert" : "status"} className={`border px-4 py-3 font-sans text-xs leading-relaxed ${toneClass}`}>
      {children}
    </div>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
  type?: string;
  inputMode?: "text" | "email" | "tel";
  inputClass?: string;
};

function TextField({ id, label, value, onChange, onBlur, error, placeholder, autoComplete, type = "text", inputMode, inputClass }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label} <span className="text-brass">*</span>
      </label>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        placeholder={placeholder}
        required
        className={inputClass ?? fieldClass(error)}
      />
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-paper-pure">{error}</p>}
    </div>
  );
}

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  autoComplete: string;
  placeholder?: string;
  describedBy?: string;
  footer?: ReactNode;
  inputClass?: string;
};

function PasswordField({ id, label, value, onChange, onBlur, error, autoComplete, placeholder, describedBy, footer, inputClass }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const described = [error ? `${id}-error` : null, describedBy || null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label} <span className="text-brass">*</span>
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
          placeholder={placeholder}
          required
          className={`${inputClass ?? fieldClass(error)} pr-12`}
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
      {footer}
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-paper-pure">{error}</p>}
    </div>
  );
}

const submitClass =
  "btn-primary group w-full disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-brass";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeInternalPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = (): Errors => {
    const next: Errors = {};
    if (!email.trim()) next.email = "Please enter your email address.";
    else if (!emailPattern.test(email.trim())) next.email = "Enter a valid address, for example name@company.com.";
    if (!password) next.password = "Please enter your password.";
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
      const profile = await login(email.trim(), password, remember);
      if (!profile) throw new Error("The sign-in response did not include an account.");
      router.push(nextPath ?? "/dashboard/");
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error, "We couldn't sign you in. Check your details and try again.") });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="border border-white/10 bg-surface p-6 sm:p-10">
      <div className="mb-8 border-b border-white/10 pb-6">
        <p className="eyebrow">Account access</p>
        <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Welcome back.</h2>
      </div>

      <div className="space-y-6">
        {notice && <StatusNotice tone={notice.tone}>{notice.text}</StatusNotice>}

        <TextField
          id="email"
          label="Email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="alex@company.com"
          value={email}
          onChange={(value) => { setEmail(value); setErrors((current) => ({ ...current, email: undefined })); }}
          onBlur={() => setErrors((current) => ({ ...current, email: email.trim() && !emailPattern.test(email.trim()) ? "Enter a valid address, for example name@company.com." : undefined }))}
          error={errors.email}
        />

        <div>
          <PasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(value) => { setPassword(value); setErrors((current) => ({ ...current, password: undefined })); }}
            error={errors.password}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <label htmlFor="remember" className="inline-flex min-h-8 items-center gap-3 font-sans text-xs text-paper-dim">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 border-white/20 bg-white/[0.02] accent-brass"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password/"
              className="link-underline font-sans text-xs text-paper-dim transition-colors hover:text-brass"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button type="submit" disabled={loading} className={submitClass}>
          {loading ? <LoaderCircle size={17} aria-hidden="true" className="animate-spin" /> : null}
          {loading ? "Signing in" : "Log in"}
        </button>

        <p className="font-sans text-xs leading-relaxed text-paper-faint">
          New to Kamora Tech? <Link href="/signup/" className="link-underline text-brass">Create an account</Link>
        </p>
      </div>
    </form>
  );
}

export function SignupForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState<SignupValues>(initialSignupValues);
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [verifying, setVerifying] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const passwordChecks = {
    length: values.password.length >= 8,
    uppercase: /[A-Z]/.test(values.password),
    lowercase: /[a-z]/.test(values.password),
    number: /\d/.test(values.password),
  };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!values.full_name.trim()) next.full_name = "Please complete all required fields.";
    if (!values.email.trim()) next.email = "Please complete all required fields.";
    else if (!emailPattern.test(values.email.trim())) next.email = "Please enter a valid email address.";
    if (!values.phone.trim()) next.phone = "Please complete all required fields.";
    else if (values.phone.replace(/\D/g, "").length < 7) next.phone = "Please complete all required fields.";
    if (!values.password) next.password = "Please complete all required fields.";
    else if (!passwordChecks.length || !passwordChecks.uppercase || !passwordChecks.lowercase || !passwordChecks.number) {
      next.password = "Please enter a stronger password.";
    }
    if (!values.confirm_password) next.confirm_password = "Please complete all required fields.";
    else if (values.confirm_password !== values.password) next.confirm_password = "Passwords do not match.";
    if (!values.accept_terms) next.accept_terms = "Please accept the Terms and Conditions.";
    return next;
  };

  const update = <K extends keyof SignupValues>(field: K, value: SignupValues[K]) => {
    setValues((current) => {
      const nextValues = { ...current, [field]: value };
      if (field === "password" || field === "confirm_password") {
        setErrors((currentErrors) => {
          const nextErrors = { ...currentErrors, [field]: undefined };
          if (field === "password" && nextValues.confirm_password && nextValues.password !== nextValues.confirm_password) {
            nextErrors.confirm_password = "Passwords do not match.";
          } else if (field === "password" && nextValues.confirm_password && nextValues.password === nextValues.confirm_password) {
            nextErrors.confirm_password = undefined;
          }
          if (field === "confirm_password") {
            if (nextValues.password && value !== nextValues.password) {
              nextErrors.confirm_password = "Passwords do not match.";
            } else {
              nextErrors.confirm_password = undefined;
            }
          }
          return nextErrors;
        });
      } else {
        setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
      }
      return nextValues;
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) {
      const order: (keyof SignupValues)[] = ["full_name", "email", "phone", "password", "confirm_password", "accept_terms"];
      const first = order.find((field) => next[field]);
      setNotice({ tone: "error", text: first ? (next[first] as string) : "Please complete all required fields." });
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setLoading(true);
    setNotice(null);
    setVerification(null);
    try {
      const result = await register({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
        confirm_password: values.confirm_password,
        accept_terms: values.accept_terms,
      });

      const token = result.token?.trim() ?? "";
      if (token) {
        setVerification({ token, link: result.link ?? null, message: result.message });
        setNotice({ tone: "success", text: result.message });
      } else {
        setNotice({ tone: "success", text: "Your account has been created successfully." });
        redirectTimer.current = setTimeout(() => {
          router.push("/login/?registered=1");
        }, 1200);
      }
    } catch (error) {
      setNotice({ tone: "error", text: signupErrorMessage(error, "Unable to connect to the server. Please try again.") });
    } finally {
      setLoading(false);
    }
  };

  const verifyNow = async () => {
    if (!verification) return;
    setVerifying(true);
    setNotice(null);
    try {
      const result = await apiFetch<MessageResponse>("/api/v1/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token: verification.token }),
      });
      setVerification(null);
      setNotice({ tone: "success", text: result.message || "Email verified successfully." });
    } catch (error) {
      setNotice({ tone: "error", text: errorMessage(error, "We couldn't verify your email. Please try again.") });
    } finally {
      setVerifying(false);
    }
  };

  const requirements = [
    { key: "length", label: "8+ characters", met: passwordChecks.length },
    { key: "uppercase", label: "Uppercase letter", met: passwordChecks.uppercase },
    { key: "lowercase", label: "Lowercase letter", met: passwordChecks.lowercase },
    { key: "number", label: "Number", met: passwordChecks.number },
  ];

  return (
    <form onSubmit={onSubmit} noValidate className="border border-white/10 bg-surface p-6 sm:p-10">
      <div className="mb-8 border-b border-white/10 pb-6">
        <p className="eyebrow">Create account</p>
        <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Join Kamora Tech.</h2>
      </div>

      <div className="space-y-6">
        {notice && <StatusNotice tone={notice.tone}>{notice.text}</StatusNotice>}

        {verification && (
          <div className="border border-brass/60 bg-brass/[0.08] p-5">
            <p className="eyebrow">Development verification</p>
            <p className="mt-3 font-sans text-xs leading-relaxed text-paper-dim">
              Email delivery is not configured on the backend. Use the verification link below or verify now.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/verify-email/?token=${encodeURIComponent(verification.token)}`}
                className="btn-primary w-full sm:w-auto"
              >
                Open verification link
              </Link>
              <button
                type="button"
                onClick={verifyNow}
                disabled={verifying}
                className="btn-outline w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {verifying ? <LoaderCircle size={17} aria-hidden="true" className="animate-spin" /> : null}
                {verifying ? "Verifying" : "Verify now"}
              </button>
            </div>
            {verification.link && (
              <p className="mt-4 break-all font-sans text-[11px] leading-relaxed text-paper-faint">
                Backend link: <span className="text-brass">{verification.link}</span>
              </p>
            )}
          </div>
        )}

        <TextField
          id="full_name"
          label="Full name"
          autoComplete="name"
          placeholder="Alex Morgan"
          value={values.full_name}
          onChange={(value) => update("full_name", value)}
          error={errors.full_name}
          inputClass={signupFieldClass(errors.full_name)}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <TextField
            id="email"
            label="Email address"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="alex@company.com"
            value={values.email}
            onChange={(value) => update("email", value)}
            error={errors.email}
            inputClass={signupFieldClass(errors.email)}
          />
          <TextField
            id="phone"
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+1 555 000 0000"
            value={values.phone}
            onChange={(value) => update("phone", value)}
            error={errors.phone}
            inputClass={signupFieldClass(errors.phone)}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <PasswordField
            id="password"
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={values.password}
            onChange={(value) => update("password", value)}
            error={errors.password}
            describedBy="password-requirements"
            inputClass={signupFieldClass(errors.password)}
            footer={
              <ul id="password-requirements" className="mt-3 space-y-1 font-sans text-[11px] leading-relaxed">
                {requirements.map((item) => (
                  <li key={item.key} className={item.met ? "text-paper-pure" : "text-paper-faint"}>
                    <span aria-hidden="true" className="mr-2 inline-block w-3 text-center">{item.met ? "✓" : "•"}</span>
                    {item.label}
                  </li>
                ))}
              </ul>
            }
          />
          <PasswordField
            id="confirm_password"
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={values.confirm_password}
            onChange={(value) => update("confirm_password", value)}
            error={errors.confirm_password}
            inputClass={signupFieldClass(errors.confirm_password)}
          />
        </div>

        <div>
          <label htmlFor="accept_terms" className="inline-flex items-start gap-3 font-sans text-xs leading-relaxed text-paper-dim">
            <input
              id="accept_terms"
              name="accept_terms"
              type="checkbox"
              checked={values.accept_terms}
              onChange={(event) => update("accept_terms", event.target.checked)}
              aria-invalid={Boolean(errors.accept_terms)}
              aria-describedby={errors.accept_terms ? "accept_terms-error" : undefined}
              className={`mt-0.5 h-4 w-4 shrink-0 rounded-sm border bg-white/[0.02] accent-brass focus:outline-none focus:ring-1 focus:ring-brass ${errors.accept_terms ? "border-brass" : "border-white/20"}`}
              required
            />
            <span>I accept the terms and conditions and privacy policy.</span>
          </label>
          {errors.accept_terms && <p id="accept_terms-error" role="alert" className="mt-2 text-xs text-paper-pure">{errors.accept_terms}</p>}
        </div>

        <button type="submit" disabled={loading} className={submitClass}>
          {loading ? <LoaderCircle size={17} aria-hidden="true" className="animate-spin" /> : null}
          {loading ? "Creating account" : "Create account"}
        </button>

        <p className="font-sans text-xs leading-relaxed text-paper-faint">
          Already have an account? <Link href="/login/" className="link-underline text-brass">Log in</Link>
        </p>
      </div>
    </form>
  );
}
