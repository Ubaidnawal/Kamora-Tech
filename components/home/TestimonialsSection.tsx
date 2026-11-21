"use client";

import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { RatingStars } from "@/components/reviews/RatingStars";
import { Reveal } from "@/components/site/Reveal";
import { apiFetch } from "@/lib/api";
import { formatRating } from "@/lib/commerce";

type ApiTestimonial = {
  id: string;
  user_name: string;
  user_avatar?: string | null;
  rating: number;
  review_text: string;
  product_name?: string | null;
  created_at: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "C") + (parts[1]?.[0] ?? "");
}

export function TestimonialsSection() {
  const [items, setItems] = useState<ApiTestimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiFetch<ApiTestimonial[]>("/api/v1/products/reviews/testimonials?limit=9", { skipCsrf: true })
      .then((data) => {
        if (active) setItems(Array.isArray(data) ? data.filter((x) => x.review_text?.trim()) : []);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="testimonials" className="scroll-mt-28 border-b border-white/10 bg-ink py-16 md:py-20 lg:py-24">
      <div className="site-container">
        <Reveal className="max-w-3xl">
          <span className="inline-flex items-center gap-3 text-sm font-medium text-paper-dim/70">
            <span className="h-px w-8 bg-brass" aria-hidden="true" />
            Client feedback
          </span>
          <h2 className="section-title mt-5 text-paper-pure">What Our Clients Say</h2>
          <p className="body-copy mt-5">
            Real feedback from customers who have reviewed Kamora Tech products and services.
          </p>
        </Reveal>

        {loading ? (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="min-h-[220px] rounded-xl border border-white/10 bg-white/[0.03] p-6 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Reveal delay={0.05}>
            <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
              <p className="font-title text-xl uppercase tracking-wide text-paper-pure">Testimonials coming soon</p>
              <p className="mt-3 text-sm leading-relaxed text-paper-dim/75">
                As clients share verified reviews, they will appear here.
              </p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <Reveal key={item.id} delay={(index % 3) * 0.06} className="h-full">
                <article className="group flex h-full flex-col rounded-xl border border-white/10 bg-[#FFFFFF] p-6 text-[#0B0B0B] shadow-[0_2px_10px_rgba(11,11,11,0.06)] transition-all duration-300 ease-editorial hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(11,11,11,0.12),0_8px_18px_rgba(139,13,26,0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  <div className="flex items-start justify-between gap-4">
                    <RatingStars value={item.rating} variant="compact" className="text-[#F59E0B]" label={`${item.user_name} rated ${item.rating} out of 5 stars`} />
                    <Quote size={18} className="shrink-0 text-brass/60" aria-hidden="true" />
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-[#333333]">&ldquo;{item.review_text}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-[#e5e5e5] pt-4">
                    {item.user_avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.user_avatar} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brass/10 font-sans text-xs font-semibold uppercase text-brass">
                        {initials(item.user_name)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-sans text-sm font-semibold text-[#0B0B0B]">{item.user_name}</p>
                      <p className="truncate font-sans text-[11px] text-[#666666]">
                        {item.product_name ? item.product_name : "Verified client"} {item.rating ? `• ${formatRating(item.rating)}/5` : ""}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
