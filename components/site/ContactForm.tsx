"use client";

import { ArrowRight, Check, LoaderCircle, Mail } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { contactEmail } from "@/lib/data";

type FieldName = "name" | "email" | "service" | "message";
type Errors = Partial<Record<FieldName, string>>;
type ContactResponse = { message?: string };

const submitErrorText = "We couldn't send your message right now. Please try again or email us directly.";

const initialValues: Record<FieldName | "company", string> = {
  name: "",
  email: "",
  company: "",
  service: "",
  message: "",
};

const services = [
  "Website Development",
  "Software Development",
  "E-Commerce Solution",
  "Management System",
  "Business Automation",
  "Something else",
];

export function ContactForm() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fields = useRef<Partial<Record<FieldName, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>>({});

  const validate = (field: FieldName, value: string): string | undefined => {
    if (field === "name" && value.trim().length < 2) return "Please enter your name.";
    if (field === "email") {
      if (!value.trim()) return "Please enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid address, for example name@company.com.";
    }
    if (field === "service" && !value) return "Please choose the type of project.";
    if (field === "message" && value.trim().length < 20) return "Please add a little more detail (at least 20 characters).";
    return undefined;
  };

  const update = (field: FieldName | "company", value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field in errors) setErrors((current) => ({ ...current, [field]: validate(field as FieldName, value) }));
  };

  const mailto = () => {
    const subject = encodeURIComponent(`New project enquiry — ${values.service}`);
    const body = encodeURIComponent(
      [`Name: ${values.name}`, `Email: ${values.email}`, `Company: ${values.company || "Not provided"}`, `Project type: ${values.service}`, "", "Project details:", values.message].join("\n"),
    );
    return `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  const buildPayload = () => {
    const subject = `New project enquiry — ${values.service}`;
    const message = [
      `Company: ${values.company.trim() || "Not provided"}`,
      `Project type: ${values.service}`,
      "",
      values.message.trim(),
    ].join("\n");
    return {
      full_name: values.name.trim(),
      email: values.email.trim(),
      phone_number: null,
      subject,
      message,
    };
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const next: Errors = {};
    (["name", "email", "service", "message"] as FieldName[]).forEach((field) => {
      const error = validate(field, values[field]);
      if (error) next[field] = error;
    });
    setErrors(next);
    const firstInvalid = (["name", "email", "service", "message"] as FieldName[]).find((field) => next[field]);
    if (firstInvalid) {
      fields.current[firstInvalid]?.focus();
      return;
    }
    setSubmitError(null);
    setLoading(true);
    try {
      await apiFetch<ContactResponse>("/api/v1/contact", {
        method: "POST",
        body: JSON.stringify(buildPayload()),
      });
      setSubmitted(true);
    } catch {
      setSubmitError(submitErrorText);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[560px] flex-col items-start justify-center border border-brass/30 bg-surface p-8 sm:p-12">
        <span className="flex h-14 w-14 items-center justify-center border border-brass/50 text-brass">
          <Check size={26} strokeWidth={1.4} aria-hidden="true" />
        </span>
        <h2 className="display-md mt-8 text-3xl text-paper-pure sm:text-4xl">Message sent</h2>
        <p className="body-copy mt-5">
          Thank you — your enquiry has reached our team. We will get back to you within one business day. If you need to reach us sooner, you can email us directly.
        </p>
        <a href={mailto()} className="btn-primary mt-8"><Mail size={16} aria-hidden="true" />Email us directly</a>
        <button
          type="button"
          onClick={() => { setValues(initialValues); setErrors({}); setSubmitError(null); setSubmitted(false); }}
          className="mt-5 min-h-11 border-b border-white/30 pb-1 font-sans text-xs uppercase tracking-widest text-paper-dim transition-colors hover:text-brass"
        >
          Write another message
        </button>
      </div>
    );
  }

  const inputClass = (field: FieldName) =>
    `mt-2 min-h-12 w-full border bg-white/[0.02] px-4 py-3 text-sm text-paper-pure placeholder:text-paper-faint/70 transition-colors duration-200 focus:border-brass focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
      errors[field] ? "border-brass" : "border-white/15"
    }`;

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={loading} className="border border-white/10 bg-surface p-6 sm:p-10 lg:p-12">
      <div className="mb-10 flex items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <p className="eyebrow">Project enquiry</p>
          <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Tell us what you need.</h2>
        </div>
        <span className="font-condense text-sm tracking-widest text-paper-faint">01—04</span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">Your name <span className="text-brass">*</span></label>
          <input
            ref={(el) => { fields.current.name = el; }}
            id="name" name="name" type="text" autoComplete="name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            onBlur={(event) => setErrors((current) => ({ ...current, name: validate("name", event.target.value) }))}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            placeholder="Alex Morgan"
            disabled={loading}
            className={inputClass("name")}
          />
          {errors.name && <p id="name-error" role="alert" className="mt-2 text-xs text-paper-pure">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">Email address <span className="text-brass">*</span></label>
          <input
            ref={(el) => { fields.current.email = el; }}
            id="email" name="email" type="email" autoComplete="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            onBlur={(event) => setErrors((current) => ({ ...current, email: validate("email", event.target.value) }))}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="alex@company.com"
            disabled={loading}
            className={inputClass("email")}
          />
          {errors.email && <p id="email-error" role="alert" className="mt-2 text-xs text-paper-pure">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="company" className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">Company <span className="text-paper-faint">(optional)</span></label>
          <input
            id="company" name="company" type="text" autoComplete="organization"
            value={values.company}
            onChange={(event) => update("company", event.target.value)}
            placeholder="Company name"
            disabled={loading}
            className="mt-2 min-h-12 w-full border border-white/15 bg-white/[0.02] px-4 py-3 text-sm text-paper-pure placeholder:text-paper-faint/70 transition-colors focus:border-brass focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="service" className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">What do you need? <span className="text-brass">*</span></label>
          <select
            ref={(el) => { fields.current.service = el; }}
            id="service" name="service"
            value={values.service}
            onChange={(event) => update("service", event.target.value)}
            onBlur={(event) => setErrors((current) => ({ ...current, service: validate("service", event.target.value) }))}
            aria-invalid={Boolean(errors.service)}
            aria-describedby={errors.service ? "service-error" : undefined}
            disabled={loading}
            className={`${inputClass("service")} appearance-none`}
          >
            <option value="" className="bg-surface">Select a service</option>
            {services.map((service) => <option key={service} value={service} className="bg-surface">{service}</option>)}
          </select>
          {errors.service && <p id="service-error" role="alert" className="mt-2 text-xs text-paper-pure">{errors.service}</p>}
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="message" className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">Tell us about your project <span className="text-brass">*</span></label>
        <textarea
          ref={(el) => { fields.current.message = el; }}
          id="message" name="message" rows={6}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          onBlur={(event) => setErrors((current) => ({ ...current, message: validate("message", event.target.value) }))}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error message-help" : "message-help"}
          placeholder="What are you building, who is it for, and what would success look like?"
          disabled={loading}
          className={`${inputClass("message")} resize-y`}
        />
        <p id="message-help" className="mt-2 text-[11px] text-paper-faint">A few sentences are plenty. At least 20 characters.</p>
        {errors.message && <p id="message-error" role="alert" className="mt-2 text-xs text-paper-pure">{errors.message}</p>}
      </div>

      {submitError && (
        <p role="alert" className="mt-6 border border-brass/60 bg-brass/[0.08] px-4 py-3 font-sans text-xs leading-relaxed text-paper-pure">
          {submitError}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-xs leading-relaxed text-paper-faint">
          Submitting sends your details securely to our team, who use them only to respond to your enquiry.
        </p>
        <button type="submit" disabled={loading} className="btn-primary group disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? (
            <>Sending... <LoaderCircle size={17} aria-hidden="true" className="animate-spin" /></>
          ) : (
            <>Send enquiry <ArrowRight size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" /></>
          )}
        </button>
      </div>
    </form>
  );
}
