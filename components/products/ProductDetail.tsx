"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { ProductReviews } from "@/components/reviews/ProductReviews";
import { Reveal } from "@/components/site/Reveal";
import { apiFetch } from "@/lib/api";
import { formatMoney, type ApiProduct } from "@/lib/commerce";
import { getRelatedProducts, productInquiryHref, type Product } from "@/lib/products";

type ProductOverlay = Partial<Pick<Product, "name" | "summary" | "description" | "image" | "category" | "price" | "currency" | "badge" | "is_available">>;

export function ProductDetail({ product }: { product: Product }) {
  const [overlay, setOverlay] = useState<ProductOverlay>({});

  useEffect(() => {
    let active = true;
    apiFetch<ApiProduct>(`/api/v1/products/${encodeURIComponent(product.slug)}`, { skipCsrf: true })
      .then((data) => {
        if (!active) return;
        const primary = data.images?.find((image) => image.is_primary) ?? data.images?.[0];
        setOverlay({
          name: data.name || product.name,
          summary: data.short_description || data.description || product.summary,
          description: data.description || product.description,
          image: primary?.url || product.image,
          category: data.category?.name || product.category,
          price: data.price ?? null,
          currency: data.currency || product.currency || "USD",
          badge: data.badge ?? null,
          is_available: data.is_available ?? true,
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [product.currency, product.description, product.image, product.name, product.slug, product.summary, product.category]);

  const view: Product = { ...product, ...overlay };
  const related = getRelatedProducts(product);
  const mailto = productInquiryHref(view);
  const isAvailable = view.is_available !== false;

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-background pt-36 lg:pt-44">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <div className="site-container relative pb-14 lg:pb-20">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-sans text-[10px] uppercase tracking-[0.18em] text-paper-faint">
            <Link href="/" className="transition-colors hover:text-brass">Home</Link>
            <span>/</span>
            <Link href="/#products" className="transition-colors hover:text-brass">Products</Link>
            <span>/</span>
            <span className="text-brass">{view.name}</span>
          </nav>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
            <Reveal>
              <div className="mb-8 flex items-center gap-4">
                <span className="font-condense text-sm tracking-[0.2em] text-brass">{view.category}</span>
                <span className="h-px w-10 bg-brass/70" />
                <span className="eyebrow">Kamora solution</span>
              </div>
              <h1 className="display-xl text-[clamp(2.8rem,7vw,6rem)] text-paper-pure">{view.name}</h1>
              {view.badge && (
                <span className="mt-5 inline-flex border border-brass bg-brass px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-pure">
                  {view.badge}
                </span>
              )}
              <p className="body-copy mt-7">{view.summary}</p>
              <p className="mt-4 font-sans text-lg font-semibold text-brass">{formatMoney(view.price ?? null, view.currency ?? "USD")}</p>
              <p className={`mt-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] ${isAvailable ? "text-[#15803D]" : "text-burgundy"}`}>
                {isAvailable ? "Available to order" : "Currently unavailable"}
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <AddToCartButton slug={view.slug} label={`Add ${view.name} to cart`} disabled={!isAvailable} />
                <a href={mailto} className="btn-outline">
                  <Mail size={16} aria-hidden="true" />
                  Enquire about this solution
                </a>
              </div>
              <p className="mt-6 max-w-xl font-sans text-[11px] leading-relaxed text-paper-faint">
                Pricing and scope are confirmed in a fixed-scope proposal after a short discovery call.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <figure className="relative overflow-hidden rounded-2xl border border-paper/10 bg-surface p-3 shadow-2xl shadow-black/60">
                <Image
                  src={view.image}
                  alt={`${view.name} interface preview`}
                  width={1200}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                />
                {view.badge && (
                  <span className="absolute left-6 top-6 border border-brass bg-brass px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-paper-pure">
                    {view.badge}
                  </span>
                )}
              </figure>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-background py-20 lg:py-28">
        <div className="site-container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="eyebrow">Overview</p>
            <h2 className="mt-5 font-title text-3xl font-medium uppercase tracking-wide text-paper-pure">Built for the way you work.</h2>
            <p className="body-copy mt-6">{view.description}</p>
            <Link href={product.categoryHref} className="link-underline mt-8 inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
              View {view.category}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </Reveal>

          <div className="space-y-6">
            {[
              { title: "What is included", items: product.features },
              { title: "Scope areas", items: product.scope },
              { title: "Benefits", items: product.benefits },
            ].map((group) => (
              <Reveal key={group.title}>
                <div className="border border-white/10 bg-surface p-6 sm:p-8">
                  <h3 className="font-title text-lg font-medium uppercase tracking-wide text-paper-pure">{group.title}</h3>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-paper-dim">
                        <Check size={15} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-brass" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ProductReviews slug={view.slug} />

      {related.length > 0 && (
        <section className="border-t border-white/10 bg-ink py-20 lg:py-28">
          <div className="site-container">
            <div className="flex flex-col gap-6 border-b border-white/10 pb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Related solutions</p>
                <h2 className="mt-4 font-title text-3xl font-medium uppercase tracking-wide text-paper-pure">Continue exploring.</h2>
              </div>
              <Link href="/#products" className="inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
                <ArrowLeft size={14} aria-hidden="true" />
                All products
              </Link>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <Link key={item.slug} href={`/products/${item.slug}/`} className="group flex flex-col gap-4 border border-white/10 bg-background p-5 transition-colors hover:border-brass/60">
                  <div className="overflow-hidden rounded-xl border border-paper/10">
                    <Image
                      src={item.image}
                      alt={`${item.name} interface preview`}
                      width={1200}
                      height={900}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div>
                    <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-brass">{item.category}</p>
                    <h3 className="mt-2 font-title text-lg font-medium uppercase tracking-wide text-paper-pure group-hover:text-brass">{item.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-white/10 bg-background py-16">
        <div className="site-container flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-title text-2xl uppercase tracking-wide text-paper-pure">Ready to discuss {view.name}?</p>
          <div className="flex flex-wrap gap-3">
            <a href={mailto} className="btn-primary">Contact us</a>
            <Link href="/cart/" className="btn-outline">View cart</Link>
          </div>
        </div>
      </section>
    </>
  );
}
