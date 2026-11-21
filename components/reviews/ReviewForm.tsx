"use client";

import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { StarRatingInput } from "@/components/reviews/RatingStars";
import { apiFetch } from "@/lib/api";
import { errorMessage, type ApiReview } from "@/lib/commerce";

const MAX_REVIEW_LENGTH = 1000;

type ReviewFormProps = {
  slug: string;
  myReview: ApiReview | null;
  myReviewLoading: boolean;
  onSubmitted: () => void;
};

type Notice = { tone: "success" | "error"; text: string };

export function ReviewForm({ slug, myReview, myReviewLoading, onSubmitted }: ReviewFormProps) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setRating(myReview?.rating ?? 0);
    setReviewText(myReview?.review_text ?? "");
    setValidationError(null);
  }, [myReview, slug]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (rating < 1 || rating > 5) {
      setValidationError("Select a star rating before submitting.");
      return;
    }
    if (reviewText.length > MAX_REVIEW_LENGTH) {
      setValidationError(`Keep your review under ${MAX_REVIEW_LENGTH} characters.`);
      return;
    }

    setValidationError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await apiFetch<ApiReview>(`/api/v1/products/${encodeURIComponent(slug)}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, review_text: reviewText.trim() }),
      });
      setNotice({
        tone: "success",
        text: myReview ? "Your review has been updated." : "Thank you. Your review has been submitted.",
      });
      onSubmitted();
    } catch (caught) {
      setNotice({ tone: "error", text: errorMessage(caught, "Unable to save your review. Please try again.") });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="border border-paper/10 bg-paper/[0.02] p-6 sm:p-8">
        <p className="font-sans text-xs text-paper-faint" role="status">Checking account access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const loginHref = `/login/?next=${encodeURIComponent(pathname || `/products/${slug}/`)}`;
    return (
      <div className="border border-paper/10 bg-paper/[0.02] p-6 sm:p-8">
        <p className="eyebrow">Your review</p>
        <h3 className="mt-3 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">Rate Product</h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-paper-dim/75">
          Log in to share your experience and rate this product.
        </p>
        <Link href={loginHref} className="btn-primary mt-6">Rate Product</Link>
      </div>
    );
  }

  if (myReviewLoading) {
    return (
      <div className="border border-paper/10 bg-paper/[0.02] p-6 sm:p-8">
        <p className="font-sans text-xs text-paper-faint" role="status">Loading your review...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="border border-paper/10 bg-paper/[0.02] p-6 sm:p-8">
      <div className="border-b border-paper/10 pb-6">
        <p className="eyebrow">Your review</p>
        <h3 className="mt-3 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">
          {myReview ? "Update Review" : "Rate this product"}
        </h3>
      </div>

      <div className="mt-6 space-y-6">
        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={`border px-4 py-3 font-sans text-xs leading-relaxed ${
              notice.tone === "error"
                ? "border-brass/60 bg-brass/[0.08] text-paper-pure"
                : "border-brass/40 bg-brass/[0.06] text-paper-pure"
            }`}
          >
            {notice.text}
          </p>
        )}

        <div>
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">
            Star rating <span className="text-brass">*</span>
          </p>
          <StarRatingInput
            value={rating}
            onChange={(next) => {
              setRating(next);
              setValidationError(null);
            }}
            label="Star rating"
            className="mt-3"
            disabled={submitting}
          />
          {validationError && (
            <p role="alert" className="mt-3 font-sans text-xs text-paper-pure">
              {validationError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`review-text-${slug}`} className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-paper-dim">
            Review <span className="font-normal normal-case tracking-normal text-paper-faint">(optional)</span>
          </label>
          <textarea
            id={`review-text-${slug}`}
            value={reviewText}
            onChange={(event) => {
              setReviewText(event.target.value);
              setValidationError(null);
            }}
            maxLength={MAX_REVIEW_LENGTH}
            rows={5}
            placeholder="Share what worked well and what could be improved."
            className="mt-2 w-full resize-y border border-white/15 bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-paper-pure placeholder:text-paper-faint/70 transition-colors focus:border-brass focus:outline-none"
          />
          <p className="mt-2 text-right font-sans text-[10px] text-paper-faint">
            {reviewText.length}/{MAX_REVIEW_LENGTH}
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-brass"
        >
          {submitting && <LoaderCircle size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
          {submitting ? "Saving" : myReview ? "Update Review" : "Submit Review"}
        </button>
        {myReview && !submitting && (
          <p className="font-sans text-[11px] text-paper-faint">You can update your review any time. Only one review per product is kept.</p>
        )}
      </div>
    </form>
  );
}
