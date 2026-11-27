"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { RatingStars } from "@/components/reviews/RatingStars";
import { useRatingSummaries } from "@/components/reviews/RatingSummariesProvider";
import { TiltCard } from "@/components/site/TiltCard";
import { formatMoney, formatRating } from "@/lib/commerce";
import type { Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
  wide?: "lg" | "xl";
};

export function ProductCard({ product, wide }: ProductCardProps) {
  const detailHref = `/products/${product.slug}/`;
  const rowAtLg = wide === "lg";
  const rowAtXl = wide === "xl";
  const { getSummary, loading, error } = useRatingSummaries();
  const summary = getSummary(product.slug);
  const hasReviews = Boolean(summary && summary.review_count > 0);
  const statusText = loading
    ? "Loading ratings"
    : error
      ? "Ratings unavailable"
      : hasReviews && summary
        ? `${summary.review_count} review${summary.review_count === 1 ? "" : "s"}`
        : "No reviews yet";
  const cardPrice = product.price ?? summary?.price;
  const cardCurrency = product.currency ?? summary?.currency;
  const isAvailable = product.is_available !== false;

  return (
    <article className="group/card flex h-full flex-col overflow-hidden rounded-xl border border-[#e5e5e5] bg-[#FFFFFF] text-[#0B0B0B] shadow-[0_2px_10px_rgba(11,11,11,0.06)] transition-all duration-300 ease-editorial hover:-translate-y-1.5 hover:border-brass/35 hover:shadow-[0_18px_40px_rgba(11,11,11,0.12),0_8px_20px_rgba(139,13,26,0.08)] focus-within:border-brass/50 focus-within:shadow-[0_18px_40px_rgba(11,11,11,0.12),0_8px_20px_rgba(139,13,26,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <TiltCard max={4} className="h-full w-full">
        <div className={`group flex h-full flex-col ${rowAtLg ? "lg:flex-row" : ""} ${rowAtXl ? "xl:flex-row" : ""}`}>
          <Link
            href={detailHref}
            aria-label={`View details for ${product.name}`}
            className={`relative block shrink-0 overflow-hidden border-b border-[#e5e5e5] focus-visible:outline-paper ${
              rowAtLg ? "lg:w-[42%] lg:border-b-0 lg:border-r" : ""
            } ${rowAtXl ? "xl:w-[42%] xl:border-b-0 xl:border-r" : ""}`}
          >
            <Image
              src={product.image}
              alt={`${product.name} interface preview`}
              width={1200}
              height={900}
              loading="lazy"
              decoding="async"
              className={`aspect-[4/3] w-full object-cover transition-transform duration-500 ease-editorial group-hover/card:scale-[1.03] motion-reduce:transition-none motion-reduce:transform-none ${
                rowAtLg ? "lg:h-full lg:aspect-auto" : ""
              } ${rowAtXl ? "xl:h-full xl:aspect-auto" : ""}`}
            />
            {product.badge && (
              <span className="absolute left-4 top-4 border border-[#B00020] bg-[#B00020] px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#FFFFFF]">
                {product.badge}
              </span>
            )}
          </Link>

          <div className="flex flex-1 flex-col p-6">
            <p className="text-[12px] font-medium tracking-[0.06em] text-brass">{product.category}</p>
            <h3 className="mt-2 font-title text-lg font-semibold leading-snug text-[#0B0B0B] sm:text-xl">
              <Link href={detailHref} className="transition-colors hover:text-brass focus-visible:outline-paper">
                {product.name}
              </Link>
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[#333333]">{product.summary}</p>
            <p className={`mt-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] ${isAvailable ? "text-[#15803D]" : "text-[#B00020]"}`}>
              {isAvailable ? "Available" : "Currently unavailable"}
            </p>

            <div className="mt-5 border-t border-[#e5e5e5] pt-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <RatingStars
                  value={summary?.average_rating ?? 0}
                  variant="compact"
                  className="text-[#F59E0B] shrink-0"
                  label={hasReviews ? `Average rating ${formatRating(summary?.average_rating)} out of 5 stars` : statusText}
                />
                <span className="font-sans text-sm font-semibold leading-none text-[#0B0B0B]">
                  {hasReviews ? formatRating(summary?.average_rating) : "—"}
                </span>
                <span className="font-sans text-[11px] leading-none text-[#555555]">
                  {hasReviews && summary ? `(${summary.review_count} ${summary.review_count === 1 ? "Review" : "Reviews"})` : statusText}
                </span>
              </div>
              <p className="mt-2 font-sans text-sm font-semibold tracking-[0.01em] text-brass">
                {formatMoney(cardPrice, cardCurrency)}
              </p>
            </div>

            <ul className="mt-5 flex flex-wrap gap-2">
              {product.tags.slice(0, 3).map((tag) => (
                <li key={tag} className="border border-[#dddddd] bg-[#f8f8f8] px-2.5 py-1 text-[11px] tracking-[0.04em] text-[#555555]">
                  {tag}
                </li>
              ))}
            </ul>

            <div className="mt-auto grid grid-cols-1 gap-3 pt-7">
              <Link
                href={detailHref}
                aria-label={`View details for ${product.name}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#0B0B0B] px-5 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B0B0B] transition-all duration-200 ease-editorial hover:border-brass hover:bg-brass hover:text-paper-pure focus-visible:outline-paper"
              >
                Details
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
              <AddToCartButton slug={product.slug} className="w-full" disabled={!isAvailable} />
            </div>
          </div>
        </div>
      </TiltCard>
    </article>
  );
}
