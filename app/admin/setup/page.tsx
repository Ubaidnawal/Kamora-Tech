"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { adminPageClass, buttonPrimaryClass, inputClass, labelClass } from "@/components/admin/adminStyles";

type FieldName = "full_name" | "email" | "phone" | "password" | "confirm_password" | "setup_token";

const initialValues: Record<FieldName, string> = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  setup_token: "",
};

export default function AdminSetupPage() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const update = (field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await apiFetch<{ message: string }>("/api/v1/auth/admin-setup", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSuccess(result.message || "Administrator account created.");
      router.push("/admin/");
    } catch (value) {
      setError(value instanceof Error ? value.message : "Administrator setup could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={`${adminPageClass} flex min-h-screen items-center justify-center px-5 py-20 sm:px-8`}>
      <div className="w-full max-w-xl border border-[#E2E2E2] bg-[#FFFFFF] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:p-10">
        <span className="mx-auto flex h-12 w-12 items-center justify-center border border-[#B00020] text-[#B00020]">
          <ShieldCheck size={22} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-center font-title text-2xl font-medium uppercase tracking-wide text-[#000000]">Admin setup</h1>
        <p className="mt-3 text-center font-sans text-xs leading-relaxed text-[#555555]">
          Create the first administrator account. The setup token must match the server&apos;s <code>ADMIN_SETUP_TOKEN</code> value.
        </p>

        {error && <p role="alert" className="mt-6 border border-[#B00020] bg-[#FFF5F5] px-3 py-2 font-sans text-xs text-[#B00020]">{error}</p>}
        {success && <p role="status" className="mt-6 border border-[#15803D] bg-[#F0FDF4] px-3 py-2 font-sans text-xs text-[#15803D]">{success}</p>}

        <form onSubmit={submit} className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Full name</span>
            <input required minLength={2} value={values.full_name} onChange={(event) => update("full_name", event.target.value)} className={`${inputClass} mt-2`} disabled={busy} />
          </label>
          <label className="block">
            <span className={labelClass}>Email address</span>
            <input required type="email" autoComplete="username" value={values.email} onChange={(event) => update("email", event.target.value)} className={`${inputClass} mt-2`} disabled={busy} />
          </label>
          <label className="block">
            <span className={labelClass}>Phone</span>
            <input required value={values.phone} onChange={(event) => update("phone", event.target.value)} className={`${inputClass} mt-2`} disabled={busy} />
          </label>
          <label className="block">
            <span className={labelClass}>Password</span>
            <input required type="password" minLength={12} autoComplete="new-password" value={values.password} onChange={(event) => update("password", event.target.value)} className={`${inputClass} mt-2`} disabled={busy} />
          </label>
          <label className="block">
            <span className={labelClass}>Confirm password</span>
            <input required type="password" minLength={12} autoComplete="new-password" value={values.confirm_password} onChange={(event) => update("confirm_password", event.target.value)} className={`${inputClass} mt-2`} disabled={busy} />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Setup token</span>
            <input required value={values.setup_token} onChange={(event) => update("setup_token", event.target.value)} className={`${inputClass} mt-2`} disabled={busy} />
            <span className="mt-2 block font-sans text-[11px] leading-relaxed text-[#777777]">
              Token server environment variable <code>ADMIN_SETUP_TOKEN</code> se match hona chahiye.
            </span>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className={`${buttonPrimaryClass} w-full`}>
              {busy ? "Creating admin..." : "Create admin account"}
            </button>
          </div>
        </form>

        <div className="mt-7 border-t border-[#E2E2E2] pt-5 text-center">
          <Link href="/admin/" className="font-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B00020]">
            Back to admin sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
