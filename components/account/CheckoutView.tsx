"use client";

import { ArrowLeft, Check, ClipboardList, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useCart } from "@/components/cart/CartProvider";
import { apiFetch } from "@/lib/api";
import { errorMessage, formatMoney, humanizeStatus, statusClass, type ApiOrder } from "@/lib/commerce";

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  projectRequirements: string;
  additionalInstructions: string;
};

const fieldClass =
  "mt-2 min-h-12 w-full border border-white/15 bg-background px-4 py-3 font-sans text-sm text-paper-pure outline-none transition-colors placeholder:text-paper-faint/60 focus:border-brass";

const emptyForm: CheckoutForm = {
  fullName: "",
  email: "",
  phone: "",
  businessName: "",
  projectRequirements: "",
  additionalInstructions: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validationError(values: CheckoutForm) {
  if (values.fullName.length < 2) return "Enter your full name.";
  if (values.fullName.length > 160) return "Full name must be 160 characters or fewer.";
  if (!values.email) return "Enter your email address.";
  if (!emailPattern.test(values.email)) return "Enter a valid email address.";
  if (values.phone.length < 5) return "Enter a valid phone number.";
  if (values.phone.length > 32) return "Phone number must be 32 characters or fewer.";
  if (values.businessName.length > 160) return "Business name must be 160 characters or fewer.";
  if (values.projectRequirements.length < 10) return "Describe your project requirements in at least 10 characters.";
  return "";
}

export function CheckoutView() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, count, total, currency, refresh, clear, loading: cartLoading } = useCart();
  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{ trackingId: string; orderNumber: string; status: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      fullName: current.fullName || user.full_name || "",
      email: current.email || user.email || "",
      phone: current.phone || user.phone || "",
      businessName: current.businessName || user.company_name || "",
    }));
  }, [user]);

  const update = (key: keyof CheckoutForm) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");

    if (count === 0 || items.length === 0) {
      setError("Your cart is empty. Add at least one solution before submitting a request.");
      return;
    }

    const values: CheckoutForm = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      businessName: form.businessName.trim(),
      projectRequirements: form.projectRequirements.trim(),
      additionalInstructions: form.additionalInstructions.trim(),
    };
    const invalid = validationError(values);
    if (invalid) {
      setError(invalid);
      return;
    }

    const customer = {
      customer_name: values.fullName,
      customer_email: values.email,
      customer_phone: values.phone,
      business_name: values.businessName || null,
      project_requirements: values.projectRequirements,
      additional_instructions: values.additionalInstructions || null,
    };
    const payload = user
      ? customer
      : {
          ...customer,
          items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
        };
    const endpoint = user ? "/api/v1/orders" : "/api/v1/orders/guest";

    setSubmitting(true);
    try {
      const order = await apiFetch<ApiOrder>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (user) {
        await refresh();
      } else {
        clear();
      }

      if (user) {
        if (order.id) {
          router.push(`/orders/${order.id}/`);
          return;
        }
      }

      setConfirmation({
        trackingId: order.tracking_id,
        orderNumber: order.order_number,
        status: order.order_status,
      });
    } catch (value) {
      setError(errorMessage(value));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-16 text-center">
          <span className="h-10 w-10 animate-spin border border-brass border-t-transparent" aria-hidden="true" />
          <p className="mt-8 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-paper-faint">
            Preparing checkout
          </p>
        </div>
      </div>
    );
  }

  if (confirmation) {
    const trackingHref = `/track/?identifier=${encodeURIComponent(confirmation.trackingId)}`;
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center border border-brass/40 text-brass">
            <Check size={28} strokeWidth={1.4} aria-hidden="true" />
          </span>
          <h2 className="mt-8 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Request received</h2>
          <p className="body-copy mt-4 text-center">
            Your order request was created. No payment has been recorded and final scope will be confirmed after discovery.
          </p>
          <div className="mt-8 grid w-full max-w-2xl gap-px border border-white/10 bg-white/10 text-left sm:grid-cols-3">
            <div className="bg-background p-5">
              <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Order number</p>
              <p className="mt-2 break-words font-condense text-lg tracking-wide text-paper-pure">{confirmation.orderNumber}</p>
            </div>
            <div className="bg-background p-5">
              <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Tracking ID</p>
              <p className="mt-2 break-words font-condense text-lg tracking-wide text-brass">{confirmation.trackingId}</p>
            </div>
            <div className="bg-background p-5">
              <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Status</p>
              <span className={`mt-2 inline-flex border px-3 py-1 font-sans text-[10px] uppercase tracking-[0.16em] ${statusClass(confirmation.status)}`}>
                {humanizeStatus(confirmation.status)}
              </span>
            </div>
          </div>
          <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:flex-row">
            <Link href={trackingHref} className="btn-primary w-full sm:w-auto">Track this request</Link>
            {user && <Link href="/orders/" className="btn-outline w-full sm:w-auto">View my orders</Link>}
          </div>
          <p className="mt-6 max-w-xl font-sans text-[11px] leading-relaxed text-paper-faint">
            Save your tracking ID to check public progress at any time. We will contact you using the details you provided.
          </p>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex min-h-[360px] flex-col items-center justify-center px-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center border border-white/15 text-brass">
            <ShoppingBag size={26} strokeWidth={1.3} aria-hidden="true" />
          </span>
          <h2 className="mt-8 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Nothing to submit yet</h2>
          <p className="body-copy mt-4 text-center">Add at least one solution to your cart before creating an order request.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/#products" className="btn-primary">Browse products</Link>
            <Link href="/cart/" className="btn-outline">View cart</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="border border-brass/60 bg-brass/[0.08] px-5 py-4 font-sans text-xs leading-relaxed text-paper-pure">
          {error}
        </div>
      )}

      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="border-b border-white/10 pb-6">
          <p className="eyebrow">{user ? "Contact details" : "Guest checkout"}</p>
          <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Who should we contact?</h2>
          <p className="mt-3 font-sans text-xs leading-relaxed text-paper-dim">
            {user
              ? "We will link this request to your account so you can review it later."
              : "No account is needed. We will email tracking details after you submit."}
          </p>
        </div>

        <form noValidate onSubmit={submit} className="mt-8 grid gap-6 sm:grid-cols-2">
          <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim">
            Full name <span className="text-brass">*</span>
            <input required minLength={2} maxLength={160} autoComplete="name" value={form.fullName} onChange={update("fullName")} className={fieldClass} placeholder="Your full name" />
          </label>

          <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim">
            Email <span className="text-brass">*</span>
            <input required type="email" autoComplete="email" value={form.email} onChange={update("email")} className={fieldClass} placeholder="you@company.com" />
          </label>

          <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim">
            Phone <span className="text-brass">*</span>
            <input required minLength={5} maxLength={32} autoComplete="tel" value={form.phone} onChange={update("phone")} className={fieldClass} placeholder="Your phone number" />
          </label>

          <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim">
            Business name <span className="font-normal normal-case tracking-normal text-paper-faint">(optional)</span>
            <input maxLength={160} autoComplete="organization" value={form.businessName} onChange={update("businessName")} className={fieldClass} placeholder="Company or organisation" />
          </label>

          <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim sm:col-span-2">
            Project requirements <span className="text-brass">*</span>
            <textarea required minLength={10} rows={6} value={form.projectRequirements} onChange={update("projectRequirements")} className={`${fieldClass} resize-y`} placeholder="Tell us about the outcome you need, your audience, timelines and any must-have features." />
          </label>

          <label className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim sm:col-span-2">
            Additional instructions <span className="font-normal normal-case tracking-normal text-paper-faint">(optional)</span>
            <textarea rows={4} value={form.additionalInstructions} onChange={update("additionalInstructions")} className={`${fieldClass} resize-y`} placeholder="Anything else we should know before discovery?" />
          </label>

          <div className="sm:col-span-2">
            <div className="border border-white/10 bg-background p-5">
              <div className="flex items-center justify-between gap-4">
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim">Request summary</p>
                <p className="font-condense text-xl text-paper-pure">{count} {count === 1 ? "solution" : "solutions"}</p>
              </div>
              <ul className="mt-4 space-y-2">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 font-sans text-xs text-paper-dim">
                    <span>{item.product.name} × {item.quantity}</span>
                    <span className="font-condense text-base text-paper-pure">{formatMoney(item.lineTotal ?? item.unitPrice, currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">Estimated total</p>
                <p className="font-condense text-2xl text-brass">{formatMoney(total, currency)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/cart/" className="inline-flex min-h-12 items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim transition-colors hover:text-brass">
              <ArrowLeft size={15} aria-hidden="true" />
              Back to cart
            </Link>
            <button type="submit" disabled={submitting} aria-busy={submitting} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
              <ClipboardList size={16} aria-hidden="true" />
              {submitting ? "Placing order…" : "Place Order"}
            </button>
          </div>

          <p className="font-sans text-[11px] leading-relaxed text-paper-faint sm:col-span-2">
            This creates an order request only. No card details are collected, no payment is recorded, and final scope is confirmed after discovery.
          </p>
        </form>
      </div>
    </div>
  );
}
