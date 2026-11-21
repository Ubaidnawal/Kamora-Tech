"use client";

import { ArrowLeft, ClipboardList, Mail, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCart, type CartItem } from "@/components/cart/CartProvider";
import { ProductVisual } from "@/components/home/ProductVisual";
import { contactEmail } from "@/lib/data";
import { formatMoney, NO_PRICE_LABEL } from "@/lib/commerce";
import { getProduct } from "@/lib/products";

function CartProductThumb({ item }: { item: CartItem }) {
  const local = getProduct(item.product.slug) ?? getProduct(item.slug) ?? getProduct(item.productId);
  const image = item.product.images.find((entry) => entry.isPrimary) ?? item.product.images[0];

  if (image?.url) {
    const escapedUrl = image.url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return (
      <div
        role="img"
        aria-label={image.alt || `${item.product.name} preview`}
        className="h-full w-full bg-cover bg-center transition-transform duration-500 ease-editorial group-hover:scale-105"
        style={{ backgroundImage: `url("${escapedUrl}")` }}
      />
    );
  }

  if (local) {
    return <ProductVisual product={local} className="h-full w-full transition-transform duration-500 ease-editorial group-hover:scale-105" />;
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
      <ShoppingBag size={28} strokeWidth={1.2} aria-hidden="true" className="text-brass" />
      <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-paper-faint">{item.product.category}</span>
    </div>
  );
}

export function CartView() {
  const { items, count, total, currency, increment, decrement, removeItem, clear, loading, error, isAuthenticated } = useCart();

  const body = encodeURIComponent(
    [
      "Hello Kamora Tech,",
      "",
      "I would like to discuss the following solutions:",
      ...items.map((item) => `- ${item.product.name} (quantity ${item.quantity})`),
      "",
      "A little about the project:",
      "",
    ].join("\n"),
  );
  const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent("Kamora Tech — product enquiry")}&body=${body}`;
  const errorNotice = error ? (
    <div role="alert" className="border border-brass/60 bg-brass/[0.08] px-5 py-4 font-sans text-xs leading-relaxed text-paper-pure">
      {error}
    </div>
  ) : null;

  if (loading && items.length === 0) {
    return (
      <div className="space-y-6">
        {errorNotice}
        <div className="border border-white/10 bg-surface p-6 sm:p-10">
          <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-16 text-center">
            <span className="h-10 w-10 animate-spin border border-brass border-t-transparent" aria-hidden="true" />
            <p className="mt-8 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-paper-faint">
              Loading your cart
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        {errorNotice}
        <div className="border border-white/10 bg-surface p-6 sm:p-10">
          <div className="flex min-h-[420px] flex-col items-center justify-center px-4 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center border border-brass/40 text-brass">
              <ShoppingBag size={26} strokeWidth={1.3} aria-hidden="true" />
            </span>
            <h2 className="mt-8 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">Nothing in your cart yet</h2>
            <p className="body-copy mt-4 text-center">
              Choose the solutions you want to discuss and we will turn them into one clear project request. Pricing is confirmed after discovery and no payment is taken at checkout.
            </p>
            <p className="mt-3 font-sans text-[11px] text-paper-faint">Checkout becomes available once your cart has at least one solution.</p>
            <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Link href="/#products" className="btn-primary w-full">Continue shopping</Link>
              <Link href="/orders/" className="btn-outline w-full">View past orders</Link>
            </div>
            <a href={`mailto:${contactEmail}`} className="link-underline mt-6 inline-flex items-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
              <Mail size={14} aria-hidden="true" />
              Contact Kamora Tech
            </a>
          </div>
        </div>
      </div>
    );
  }

  const formattedTotal = formatMoney(total, currency);

  return (
    <div className="space-y-6">
      {errorNotice}

      <div className="border border-white/10 bg-surface p-6 sm:p-10">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">{isAuthenticated ? "Account cart" : "Enquiry cart"}</p>
            <h2 className="mt-3 font-title text-2xl font-medium uppercase tracking-wide text-paper-pure">
              {count} {count === 1 ? "selection" : "selections"}
            </h2>
            {isAuthenticated && <p className="mt-2 font-sans text-[11px] text-paper-faint">Saved to your account and available on this device.</p>}
          </div>
          <button type="button" onClick={clear} className="inline-flex min-h-11 items-center gap-2 self-start font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-faint transition-colors hover:text-brass">
            <Trash2 size={14} aria-hidden="true" />
            Clear cart
          </button>
        </div>

        <ul className="divide-y divide-white/10">
          {items.map((item) => {
            const local = getProduct(item.product.slug) ?? getProduct(item.slug);
            const href = local ? `/products/${item.slug}/` : "/#products";
            const linePrice = formatMoney(item.lineTotal ?? item.unitPrice, currency);

            return (
              <li key={item.id} className="grid gap-5 py-7 sm:grid-cols-[160px_1fr]">
                <Link href={href} className="group block aspect-[4/3] overflow-hidden rounded-md border border-white/10 bg-background">
                  <CartProductThumb item={item} />
                </Link>
                <div className="flex flex-col justify-between gap-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-sans text-[10px] uppercase tracking-[0.16em] text-brass">{item.product.category}</p>
                      <h3 className="mt-2 font-title text-xl font-medium uppercase tracking-wide text-paper-pure">
                        <Link href={href} className="transition-colors hover:text-brass">
                          {item.product.name}
                        </Link>
                      </h3>
                      {item.product.summary && <p className="mt-2 max-w-xl text-sm leading-relaxed text-paper-dim">{item.product.summary}</p>}
                      <p className="mt-3 font-condense text-lg tracking-wide text-paper-pure">{linePrice}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.slug)}
                      aria-label={`Remove ${item.product.name}`}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-white/15 text-paper-faint transition-colors hover:border-brass hover:text-brass"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                    <div className="inline-flex items-center border border-white/15">
                      <button type="button" onClick={() => decrement(item.slug)} aria-label={`Decrease ${item.product.name} quantity`} className="flex h-11 w-11 items-center justify-center text-paper-dim transition-colors hover:text-brass">
                        <Minus size={15} aria-hidden="true" />
                      </button>
                      <span className="w-10 text-center font-condense text-lg text-paper-pure">{item.quantity}</span>
                      <button type="button" onClick={() => increment(item.slug)} aria-label={`Increase ${item.product.name} quantity`} className="flex h-11 w-11 items-center justify-center text-paper-dim transition-colors hover:text-brass">
                        <Plus size={15} aria-hidden="true" />
                      </button>
                    </div>
                    <p className="font-sans text-xs text-paper-faint">
                      {linePrice === NO_PRICE_LABEL ? NO_PRICE_LABEL : `Line total · ${linePrice}`}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-white/10 bg-surface p-6 sm:p-8">
          <p className="eyebrow">Summary</p>
          <dl className="mt-6 space-y-4 font-sans text-sm">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <dt className="text-paper-dim">Selected solutions</dt>
              <dd className="font-condense text-xl text-paper-pure">{count}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <dt className="text-paper-dim">Subtotal</dt>
              <dd className="font-condense text-xl text-paper-pure">{formattedTotal}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-paper-dim">Total</dt>
              <dd className="font-condense text-2xl text-brass">{formattedTotal}</dd>
            </div>
          </dl>
          <p className="mt-6 text-xs leading-relaxed text-paper-faint">
            Checkout creates an order request only. Payment is never recorded here; final scope, terms and cost are confirmed after discovery.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/checkout/" className="btn-primary w-full">
            Continue to checkout
          </Link>
          <Link href="/#products" className="btn-outline w-full">
            <ArrowLeft size={16} aria-hidden="true" />
            Continue shopping
          </Link>
          <a href={mailto} className="inline-flex min-h-12 items-center justify-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim transition-colors hover:text-brass">
            <Mail size={15} aria-hidden="true" />
            Contact us about this list
          </a>
          <Link href="/orders/" className="inline-flex min-h-12 items-center justify-center gap-2 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-dim transition-colors hover:text-brass">
            <ClipboardList size={15} aria-hidden="true" />
            View past orders
          </Link>
        </div>
      </div>
    </div>
  );
}
