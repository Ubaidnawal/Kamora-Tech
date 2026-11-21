"use client";

import { Eye, EyeOff, LoaderCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AccountPageShell } from "@/components/account/AccountPageShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch, ApiError } from "@/lib/api";

type Notice = { tone: "error" | "success"; text: string };
type Errors = Record<string, string | undefined>;
type MessageResponse = { message: string; token?: string | null; link?: string | null };
type DevDetails = { token: string | null; link: string | null };
type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
  company_name?: string | null;
  address_line1?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
};
type ProfileForm = {
  full_name: string;
  phone: string;
  company_name: string;
  address_line1: string;
  city: string;
  country: string;
  timezone: string;
};
type EmailForm = { new_email: string };
type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emptyEmailForm: EmailForm = { new_email: "" };

const emptyProfileForm: ProfileForm = {
  full_name: "",
  phone: "",
  company_name: "",
  address_line1: "",
  city: "",
  country: "",
  timezone: "",
};

const emptyPasswordForm: PasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

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

function formatDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function toProfileForm(profile: Profile): ProfileForm {
  return {
    full_name: profile.full_name ?? "",
    phone: profile.phone ?? "",
    company_name: profile.company_name ?? "",
    address_line1: profile.address_line1 ?? "",
    city: profile.city ?? "",
    country: profile.country ?? "",
    timezone: profile.timezone ?? "",
  };
}

const fieldClass = (error?: string) =>
  `mt-2 min-h-12 w-full border bg-white/[0.02] px-4 py-3 text-sm text-paper-pure placeholder:text-paper-faint/70 transition-colors duration-200 focus:border-brass focus:outline-none ${
    error ? "border-brass" : "border-white/15"
  }`;

const labelClass = "font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim";

const submitClass =
  "btn-primary group disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-brass";

function StatusNotice({ notice }: { notice: Notice }) {
  return (
    <div role={notice.tone === "error" ? "alert" : "status"} className={`border px-4 py-3 font-sans text-xs leading-relaxed ${
      notice.tone === "error"
        ? "border-brass/60 bg-brass/[0.08] text-paper-pure"
        : "border-brass/40 bg-brass/[0.06] text-paper-pure"
    }`}>
      {notice.text}
    </div>
  );
}

function StatusPanel({ children }: { children: ReactNode }) {
  return <div className="border border-white/10 bg-surface p-6 sm:p-10">{children}</div>;
}

function ProfileField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClass(error)}
      />
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-paper-pure">{error}</p>}
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
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

export default function ProfilePage() {
  const { user, loading: authLoading, isAuthenticated, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyProfileForm);
  const [emailForm, setEmailForm] = useState<EmailForm>(emptyEmailForm);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(emptyPasswordForm);
  const [profileErrors, setProfileErrors] = useState<Errors>({});
  const [emailErrors, setEmailErrors] = useState<Errors>({});
  const [passwordErrors, setPasswordErrors] = useState<Errors>({});
  const [profileNotice, setProfileNotice] = useState<Notice | null>(null);
  const [emailNotice, setEmailNotice] = useState<Notice | null>(null);
  const [emailDevDetails, setEmailDevDetails] = useState<DevDetails | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailChanging, setEmailChanging] = useState(false);
  const [changing, setChanging] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace("/login/");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      setFetching(false);
      return;
    }

    let active = true;
    setFetching(true);
    apiFetch<Profile>("/api/v1/auth/me")
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setForm(toProfileForm(data));
      })
      .catch((error) => {
        if (active) setProfileNotice({ tone: "error", text: errorMessage(error, "We couldn't load your account details.") });
      })
      .finally(() => {
        if (active) setFetching(false);
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const updateProfileField = (field: keyof ProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setProfileErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateEmailField = (field: keyof EmailForm, value: string) => {
    setEmailForm((current) => ({ ...current, [field]: value }));
    setEmailErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updatePasswordField = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
    setPasswordErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validateProfile = (): Errors => {
    const next: Errors = {};
    if (!form.full_name.trim()) next.full_name = "Please enter your full name.";
    if (form.phone.replace(/\D/g, "").length < 7) next.phone = "Please enter a valid phone number.";
    return next;
  };

  const validateEmail = (): Errors => {
    const next: Errors = {};
    if (!emailPattern.test(emailForm.new_email.trim())) {
      next.new_email = "Enter a valid email address, for example name@company.com.";
    } else if (profile && emailForm.new_email.trim().toLowerCase() === profile.email.toLowerCase()) {
      next.new_email = "Enter an address different from your current one.";
    }
    return next;
  };

  const validatePassword = (): Errors => {
    const next: Errors = {};
    if (!passwordForm.current_password) next.current_password = "Please enter your current password.";
    const newPassword = passwordForm.new_password;
    if (newPassword.length < 8) next.new_password = "Use at least 8 characters.";
    else if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      next.new_password = "Use upper and lower case letters and at least one number.";
    }
    if (newPassword && newPassword === passwordForm.current_password) {
      next.new_password = "New password must be different from the current password.";
    }
    if (passwordForm.confirm_password !== newPassword) next.confirm_password = "Passwords do not match.";
    return next;
  };

  const onProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validateProfile();
    setProfileErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setProfileNotice(null);
    try {
      const payload: Record<string, string | null> = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        company_name: form.company_name.trim() || null,
        address_line1: form.address_line1.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        timezone: form.timezone.trim() || null,
      };
      const result = await apiFetch<Profile>("/api/v1/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setProfile(result);
      setForm(toProfileForm(result));
      setProfileNotice({ tone: "success", text: "Your profile details have been saved." });
      void refreshUser().catch(() => undefined);
    } catch (error) {
      setProfileNotice({ tone: "error", text: errorMessage(error, "We couldn't save your profile details.") });
    } finally {
      setSaving(false);
    }
  };

  const onEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validateEmail();
    setEmailErrors(next);
    if (Object.keys(next).length) return;

    setEmailChanging(true);
    setEmailNotice(null);
    setEmailDevDetails(null);
    try {
      const result = await apiFetch<MessageResponse>("/api/v1/users/me/email", {
        method: "POST",
        body: JSON.stringify({ new_email: emailForm.new_email.trim().toLowerCase() }),
      });
      setEmailNotice({
        tone: "success",
        text: result.message || "Verification required. Check the new email to confirm the change.",
      });
      setEmailForm(emptyEmailForm);
      if (result.token || result.link) {
        setEmailDevDetails({ token: result.token ?? null, link: result.link ?? null });
      }
    } catch (error) {
      setEmailNotice({ tone: "error", text: errorMessage(error, "We couldn't request an email change. Please try again.") });
    } finally {
      setEmailChanging(false);
    }
  };

  const onPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = validatePassword();
    setPasswordErrors(next);
    if (Object.keys(next).length) return;

    setChanging(true);
    setPasswordNotice(null);
    try {
      const result = await apiFetch<MessageResponse>("/api/v1/users/me/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
          confirm_password: passwordForm.confirm_password,
        }),
      });
      setPasswordNotice({ tone: "success", text: result.message || "Password changed successfully." });
      setPasswordForm(emptyPasswordForm);
    } catch (error) {
      setPasswordNotice({ tone: "error", text: errorMessage(error, "We couldn't change your password.") });
    } finally {
      setChanging(false);
    }
  };

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login/");
    } catch (error) {
      setProfileNotice({ tone: "error", text: errorMessage(error, "We couldn't log you out. Please try again.") });
      setLoggingOut(false);
    }
  };

  const createdDate = profile ? formatDate(profile.created_at ?? profile.createdAt) : null;
  const verificationHref = emailDevDetails?.token
    ? `/verify-email/?token=${encodeURIComponent(emailDevDetails.token)}`
    : emailDevDetails?.link;

  return (
    <AccountPageShell
      number="07"
      label="Your profile"
      pageName="Profile"
      title="Account details."
      description="Manage the personal and contact information linked to your Kamora Tech account."
    >
      <div className="space-y-8">
        {authLoading || fetching ? (
          <StatusPanel>
            <p className="inline-flex items-center gap-3 font-sans text-xs text-paper-dim">
              <LoaderCircle size={17} aria-hidden="true" className="animate-spin" />
              {authLoading ? "Checking your session..." : "Loading your account details..."}
            </p>
          </StatusPanel>
        ) : !isAuthenticated ? (
          <StatusPanel>
            <p className="font-sans text-xs text-paper-dim">Redirecting to log in...</p>
          </StatusPanel>
        ) : (
          <>
            <div className="border border-white/10 bg-surface p-6 sm:p-10">
              <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="eyebrow">Account overview</p>
                  <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">
                    {profile?.full_name ?? user?.full_name ?? "Your account"}
                  </h2>
                  <p className="mt-2 font-sans text-xs text-paper-dim">{profile?.email ?? user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={loggingOut}
                  className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loggingOut ? <LoaderCircle size={17} aria-hidden="true" className="animate-spin" /> : <LogOut size={17} aria-hidden="true" />}
                  Log out
                </button>
              </div>

              <dl className="mt-8 grid gap-6 sm:grid-cols-3">
                <div>
                  <dt className={labelClass}>Verification</dt>
                  <dd className="mt-2 font-sans text-sm text-paper-pure">
                    {profile?.is_verified ? "Verified" : "Not verified"}
                  </dd>
                </div>
                <div>
                  <dt className={labelClass}>Account created</dt>
                  <dd className="mt-2 font-sans text-sm text-paper-pure">
                    {createdDate ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className={labelClass}>Account ID</dt>
                  <dd className="mt-2 break-all font-sans text-sm text-paper-pure">{profile?.id ?? user?.id ?? "—"}</dd>
                </div>
              </dl>
            </div>

            <form onSubmit={onProfileSubmit} noValidate className="border border-white/10 bg-surface p-6 sm:p-10">
              <div className="mb-8 border-b border-white/10 pb-6">
                <p className="eyebrow">Personal information</p>
                <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Edit details.</h2>
              </div>

              <div className="space-y-6">
                {profileNotice && <StatusNotice notice={profileNotice} />}

                <div className="grid gap-6 sm:grid-cols-2">
                  <ProfileField
                    id="full_name"
                    label="Full name"
                    autoComplete="name"
                    value={form.full_name}
                    onChange={(value) => updateProfileField("full_name", value)}
                    error={profileErrors.full_name}
                  />
                  <ProfileField
                    id="phone"
                    label="Phone number"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(value) => updateProfileField("phone", value)}
                    error={profileErrors.phone}
                  />
                </div>

                <ProfileField
                  id="company_name"
                  label="Company"
                  autoComplete="organization"
                  value={form.company_name}
                  onChange={(value) => updateProfileField("company_name", value)}
                />
                <ProfileField
                  id="address_line1"
                  label="Address"
                  autoComplete="street-address"
                  value={form.address_line1}
                  onChange={(value) => updateProfileField("address_line1", value)}
                />

                <div className="grid gap-6 sm:grid-cols-3">
                  <ProfileField
                    id="city"
                    label="City"
                    autoComplete="address-level2"
                    value={form.city}
                    onChange={(value) => updateProfileField("city", value)}
                  />
                  <ProfileField
                    id="country"
                    label="Country"
                    autoComplete="country-name"
                    value={form.country}
                    onChange={(value) => updateProfileField("country", value)}
                  />
                  <ProfileField
                    id="timezone"
                    label="Timezone"
                    value={form.timezone}
                    onChange={(value) => updateProfileField("timezone", value)}
                  />
                </div>

                <button type="submit" disabled={saving} className={`${submitClass} w-full`}>
                  {saving ? <LoaderCircle size={17} aria-hidden="true" className="animate-spin" /> : null}
                  {saving ? "Saving" : "Save changes"}
                </button>
              </div>
            </form>

            <form onSubmit={onEmailSubmit} noValidate className="border border-white/10 bg-surface p-6 sm:p-10">
              <div className="mb-8 border-b border-white/10 pb-6">
                <p className="eyebrow">Email address</p>
                <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Change email.</h2>
              </div>

              <div className="space-y-6">
                {emailNotice && <StatusNotice notice={emailNotice} />}

                {emailDevDetails && verificationHref && (
                  <div className="border border-brass/60 bg-brass/[0.08] p-5">
                    <p className="eyebrow">Development only</p>
                    <p className="mt-3 font-sans text-xs leading-relaxed text-paper-dim">
                      The backend returned a verification token because email delivery is not configured. Do not use this outside local development.
                    </p>
                    <Link href={verificationHref} className="link-underline mt-4 inline-block break-all font-sans text-xs text-brass">
                      Confirm the new email address
                    </Link>
                    {emailDevDetails.link && (
                      <p className="mt-4 break-all font-sans text-[11px] leading-relaxed text-paper-faint">
                        Backend link: <span className="text-brass">{emailDevDetails.link}</span>
                      </p>
                    )}
                  </div>
                )}

                <ProfileField
                  id="new_email"
                  label="New email address"
                  type="email"
                  autoComplete="email"
                  value={emailForm.new_email}
                  onChange={(value) => updateEmailField("new_email", value)}
                  error={emailErrors.new_email}
                />

                <p className="font-sans text-[11px] leading-relaxed text-paper-faint">
                  We&apos;ll send a verification link to the new address. Your email changes once you confirm it.
                </p>

                <button type="submit" disabled={emailChanging} className={`${submitClass} w-full`}>
                  {emailChanging ? <LoaderCircle size={17} aria-hidden="true" className="animate-spin" /> : null}
                  {emailChanging ? "Sending request" : "Request email change"}
                </button>
              </div>
            </form>

            <form onSubmit={onPasswordSubmit} noValidate className="border border-white/10 bg-surface p-6 sm:p-10">
              <div className="mb-8 border-b border-white/10 pb-6">
                <p className="eyebrow">Security</p>
                <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Change password.</h2>
              </div>

              <div className="space-y-6">
                {passwordNotice && <StatusNotice notice={passwordNotice} />}

                <PasswordInput
                  id="current_password"
                  label="Current password"
                  autoComplete="current-password"
                  value={passwordForm.current_password}
                  onChange={(value) => updatePasswordField("current_password", value)}
                  error={passwordErrors.current_password}
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <PasswordInput
                    id="new_password"
                    label="New password"
                    autoComplete="new-password"
                    value={passwordForm.new_password}
                    onChange={(value) => updatePasswordField("new_password", value)}
                    error={passwordErrors.new_password}
                  />
                  <PasswordInput
                    id="confirm_password"
                    label="Confirm new password"
                    autoComplete="new-password"
                    value={passwordForm.confirm_password}
                    onChange={(value) => updatePasswordField("confirm_password", value)}
                    error={passwordErrors.confirm_password}
                  />
                </div>

                <p className="font-sans text-[11px] leading-relaxed text-paper-faint">
                  Use at least 8 characters with upper and lower case letters and a number.
                </p>

                <button type="submit" disabled={changing} className={`${submitClass} w-full`}>
                  {changing ? <LoaderCircle size={17} aria-hidden="true" className="animate-spin" /> : null}
                  {changing ? "Changing password" : "Change password"}
                </button>
              </div>
            </form>

            <p className="font-sans text-xs leading-relaxed text-paper-faint">
              Need to review an order? <Link href="/orders/" className="link-underline text-brass">View order history</Link>
            </p>
          </>
        )}
      </div>
    </AccountPageShell>
  );
}
