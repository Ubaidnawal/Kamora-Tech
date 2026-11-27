"use client";

import { useEffect, useState } from "react";
import { ArrowLink } from "@/components/site/ArrowLink";
import { Reveal } from "@/components/site/Reveal";
import { ProductCard } from "@/components/home/ProductCard";
import { RatingSummariesProvider } from "@/components/reviews/RatingSummariesProvider";
import { products, type Product } from "@/lib/products";
import { fetchFeaturedProducts } from "@/lib/productApi";

export function FeaturedProducts() {
  const [items, setItems] = useState<Product[] | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let active = true;
    fetchFeaturedProducts()
      .then((result) => {
        if (active) setItems(result);
      })
      .catch(() => {
        if (active) setUseFallback(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleProducts = items ?? (useFallback ? products : []);
  const penultimateIndex = visibleProducts.length - 2;
  const lastIndex = visibleProducts.length - 1;
  const slugs = visibleProducts.map((product) => product.slug);

  return (
    <section id="products" className="relative scroll-mt-28 border-b border-white/10 bg-background py-16 md:py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden="true" />
      <div className="site-container relative">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className="max-w-3xl">
            <span className="inline-flex items-center gap-3 text-sm font-medium text-paper-dim/70">
              <span className="h-px w-8 bg-brass" aria-hidden="true" />
              Featured solutions / 01
            </span>
            <h2 className="section-title mt-5 text-paper-pure">Our Featured Products</h2>
            <p className="body-copy mt-5">
              Explore our professional digital solutions designed to help businesses grow, operate efficiently, and build a powerful online presence.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col items-start gap-4">
            <ArrowLink href="/services/" variant="text">Explore all services</ArrowLink>
            <p className="max-w-xs text-[13px] leading-relaxed text-paper-dim/60">
              Every engagement is scoped individually. Prices and timelines are provided in a fixed-scope proposal.
            </p>
          </Reveal>
        </div>

        {visibleProducts.length === 0 && !useFallback ? (
          <div className="mt-10 border border-white/10 bg-surface p-10 text-center text-sm text-paper-dim">Loading featured solutions…</div>
        ) : (
          <RatingSummariesProvider slugs={slugs}>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product, index) => {
                const isLast = index === lastIndex;
                const isWide = index === penultimateIndex || isLast;

                return (
                  <Reveal
                    key={product.slug}
                    delay={(index % 4) * 0.06}
                    className={`h-full ${isLast ? "lg:col-span-3 xl:col-span-2" : index === penultimateIndex ? "xl:col-span-2" : ""}`}
                  >
                    <ProductCard product={product} wide={isWide ? (isLast ? "lg" : "xl") : undefined} />
                  </Reveal>
                );
              })}
            </div>
          </RatingSummariesProvider>
        )}
      </div>
    </section>
  );
}
