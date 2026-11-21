"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { formatRating } from "@/lib/commerce";

const STAR_PATH = "M12 2.6l2.86 5.8 6.4.93-4.63 4.52 1.1 6.38L12 17.22l-5.73 3.01 1.1-6.38L2.74 9.33l6.4-.93L12 2.6z";

type StarVariant = "compact" | "large";

type RatingStarsProps = {
  value: number;
  variant?: StarVariant;
  label?: string;
  className?: string;
};

type StarRatingInputProps = {
  value: number;
  onChange: (rating: number) => void;
  label?: string;
  variant?: StarVariant;
  disabled?: boolean;
  className?: string;
};

function clampRating(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, value));
}

function StarGlyph({ fill, variant }: { fill: number; variant: StarVariant }) {
  const size = variant === "large" ? 22 : 14;
  const clamped = Math.max(0, Math.min(1, fill));

  return (
    <span className="relative inline-block shrink-0 align-middle" style={{ width: size, height: size }} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-full w-full text-[#D1D5DB]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      >
        <path d={STAR_PATH} />
      </svg>
      <span className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${(100 - clamped * 100).toFixed(2)}% 0 0)` }}>
        <svg
          viewBox="0 0 24 24"
          className="absolute inset-0 h-full w-full text-current"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinejoin="round"
        >
          <path d={STAR_PATH} />
        </svg>
      </span>
    </span>
  );
}

export function RatingStars({ value, variant = "compact", label, className = "" }: RatingStarsProps) {
  const rating = clampRating(value);

  return (
    <span
      role="img"
      aria-label={label ?? `${formatRating(rating)} out of 5 stars`}
      className={`inline-flex shrink-0 items-center gap-0.5 align-middle text-brass ${className}`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <StarGlyph key={star} fill={clampRating(rating - (star - 1))} variant={variant} />
      ))}
    </span>
  );
}

export function StarRatingInput({
  value,
  onChange,
  label = "Your rating",
  variant = "large",
  disabled = false,
  className = "",
}: StarRatingInputProps) {
  const [hover, setHover] = useState<number | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const displayed = hover ?? value;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, star: number) => {
    let next = star;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(5, star + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(1, star - 1);
    else if (event.key === "Home") next = 1;
    else if (event.key === "End") next = 5;
    else return;

    event.preventDefault();
    onChange(next);
    buttons.current[next - 1]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex items-center gap-2 ${className}`}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          ref={(node) => {
            buttons.current[star - 1] = node;
          }}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          tabIndex={star === (value || 1) ? 0 : -1}
          disabled={disabled}
          onMouseEnter={() => setHover(star)}
          onFocus={() => setHover(star)}
          onBlur={() => setHover(null)}
          onClick={() => onChange(star)}
          onKeyDown={(event) => handleKeyDown(event, star)}
          className="rounded-sm p-1 transition-transform duration-200 ease-editorial hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass motion-reduce:transform-none motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <StarGlyph fill={displayed >= star ? 1 : 0} variant={variant} />
        </button>
      ))}
    </div>
  );
}
