"use client";

import { ArrowRight, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { apiFetch } from "@/lib/api";

type FieldName = "name" | "email" | "phone" | "subject" | "message";
type Errors = Partial<Record<FieldName, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const submitErrorText = "We couldn't send your complaint right now. Please try again.";

const initialValues: Record<FieldName, string> = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const requiredFields: FieldName[] = ["name", "email", "subject", "message"];

function validate(field: FieldName, value: string): string | undefined {
  if (field === "name" && value.trim().length < 2) return "Please enter your full name.";
  if (field === "email") {
    if (!value.trim()) return "Please enter your email address.";
    if (!emailPattern.test(value.trim())) return "Enter a valid address, for example name@company.com.";
  }
  if (field === "subject" && !value.trim()) return "Please enter a subject.";
  if (field === "message" && value.trim().length < 20) return "Please add a little more detail (at least 20 characters).";
  return undefined;
}

export default function ComplainPage() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fields = useRef<Partial<Record<FieldName, HTMLInputElement | HTMLTextAreaElement | null>>>({});

  const update = (field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field in errors) setErrors((current) => ({ ...current, [field]: validate(field, value) }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const nextErrors: Errors = {};
    requiredFields.forEach((field) => {
      const error = validate(field, values[field]);
      if (error) nextErrors[field] = error;
    });
    setErrors(nextErrors);

    const firstInvalid = requiredFields.find((field) => nextErrors[field]);
    if (firstInvalid) {
      fields.current[firstInvalid]?.focus();
      return;
    }

    setSubmitError(null);
    setLoading(true);

    try {
      await apiFetch("/api/v1/contact", {
        method: "POST",
        body: JSON.stringify({
          full_name: values.name.trim(),
          email: values.email.trim(),
          phone_number: values.phone.trim() || null,
          subject: `Complaint — ${values.subject.trim()}`,
          message: values.message.trim(),
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitError(submitErrorText);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: FieldName) =>
    `mt-2 min-h-12 w-full border bg-white/[0.02] px-4 py-3 text-sm text-paper-pure placeholder:text-paper-faint/70 transition-colors duration-200 focus:border-brass focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
      errors[field] ? "border-brass" : "border-white/15"
    }`;

  return (
    <>
      <PageHero
        number="07"
        label="Complaints"
        pageName="Complaints"
        lines={[
          { text: "Tell us what", className: "text-paper-pure" },
          { text: "went wrong.", className: "text-outline-brass" },
        ]}
        description="If something about our work or service has fallen short, tell us what happened. We will review your complaint and respond with a clear next step."
        meta={[
          { value: "Private", label: "Handled confidentially" },
          { value: "< 2 days", label: "Review target" },
          { value: "Direct", label: "Team escalation" },
          { value: "01", label: "Point of contact" },
        ]}
      />

      <section className="bg-background py-24 lg:py-32">
        <div className="site-container grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <Reveal>
            <div className="border-t border-white/10">
              <h2 className="py-6 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-paper-faint">What to include</h2>
              <ol className="space-y-6">
                {[
                  { title: "What happened", description: "Give a short account of the issue and when it occurred." },
                  { title: "Who was involved", description: "Include any project, order or team member details you have." },
                  { title: "What would help", description: "Tell us what a fair resolution would look like to you." },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-5 border-t border-white/10 pt-6">
                    <span className="font-condense text-lg text-brass">{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block font-title text-base font-medium uppercase tracking-wide text-paper-pure">{step.title}</span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-paper-dim">{step.description}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-10 flex items-start gap-4 border border-brass/25 bg-brass/[0.04] p-6">
              <ShieldCheck size={20} strokeWidth={1.4} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />
              <p className="text-sm leading-relaxed text-paper-dim">
                Your complaint is sent securely to our team and used only to review and respond to your case.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            {submitted ? (
              <div role="status" className="flex min-h-[560px] flex-col items-start justify-center border border-brass/30 bg-surface p-8 sm:p-12">
                <span className="flex h-14 w-14 items-center justify-center border border-brass/50 text-brass">
                  <Check size={26} strokeWidth={1.4} aria-hidden="true" />
                </span>
                <h2 className="display-md mt-8 text-3xl text-paper-pure sm:text-4xl">Complaint sent</h2>
                <p className="body-copy mt-5">
                  Thank you — your complaint has reached our team. We will review it carefully and get back to you with a clear next step.
                </p>
                <button
                  type="button"
                  onClick={() => { setValues(initialValues); setErrors({}); setSubmitError(null); setSubmitted(false); }}
                  className="mt-8 min-h-11 border-b border-white/30 pb-1 font-sans text-xs uppercase tracking-widest text-paper-dim transition-colors hover:text-brass"
                >
                  Send another complaint
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate aria-busy={loading} className="border border-white/10 bg-surface p-6 sm:p-10 lg:p-12">
                <div className="mb-10 flex items-center justify-between gap-6 border-b border-white/10 pb-6">
                  <div>
                    <p className="eyebrow">Complaint form</p>
                    <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Tell us what happened.</h2>
                  </div>
                  <span className="font-condense text-sm tracking-widest text-paper-faint">01—05</span>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">Full name <span className="text-brass">*</span></label>
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
                    <label htmlFor="phone" className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">Phone number <span className="text-paper-faint">(optional)</span></label>
                    <input
                      ref={(el) => { fields.current.phone = el; }}
                      id="phone" name="phone" type="tel" autoComplete="tel"
                      value={values.phone}
                      onChange={(event) => update("phone", event.target.value)}
                      placeholder="+44 7700 900123"
                      disabled={loading}
                      className={inputClass("phone")}
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">Subject <span className="text-brass">*</span></label>
                    <input
                      ref={(el) => { fields.current.subject = el; }}
                      id="subject" name="subject" type="text"
                      value={values.subject}
                      onChange={(event) => update("subject", event.target.value)}
                      onBlur={(event) => setErrors((current) => ({ ...current, subject: validate("subject", event.target.value) }))}
                      aria-invalid={Boolean(errors.subject)}
                      aria-describedby={errors.subject ? "subject-error" : undefined}
                      placeholder="Brief summary of your complaint"
                      disabled={loading}
                      className={inputClass("subject")}
                    />
                    {errors.subject && <p id="subject-error" role="alert" className="mt-2 text-xs text-paper-pure">{errors.subject}</p>}
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="message" className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">Your complaint <span className="text-brass">*</span></label>
                  <textarea
                    ref={(el) => { fields.current.message = el; }}
                    id="message" name="message" rows={7}
                    value={values.message}
                    onChange={(event) => update("message", event.target.value)}
                    onBlur={(event) => setErrors((current) => ({ ...current, message: validate("message", event.target.value) }))}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "message-error message-help" : "message-help"}
                    placeholder="Tell us what happened, when it happened, and what would help resolve it."
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
                    Submitting sends your details securely to our team, who use them only to review your complaint.
                  </p>
                  <button type="submit" disabled={loading} className="btn-primary group disabled:cursor-not-allowed disabled:opacity-60">
                    {loading ? (
                      <>Sending... <LoaderCircle size={17} aria-hidden="true" className="animate-spin" /></>
                    ) : (
                      <>Submit complaint <ArrowRight size={17} aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" /></>
                    )}
                  </button>
                </div>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
