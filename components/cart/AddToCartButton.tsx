"use client";

import { Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

export function AddToCartButton({ slug, label = "Add to cart", className = "" }: { slug: string; label?: string; className?: string }) {
  const { items, addItem, loading } = useCart();
  const inCart = items.some((item) => item.slug === slug);

  return (
    <button
      type="button"
      onClick={() => addItem(slug)}
      disabled={loading}
      aria-busy={loading}
      className={`inline-flex min-h-12 items-center justify-center gap-2 border border-brass bg-brass px-5 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-paper-pure transition-all duration-200 ease-editorial hover:border-brass hover:bg-background active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {inCart ? <Plus size={15} aria-hidden="true" /> : <ShoppingBag size={15} aria-hidden="true" />}
      {loading ? "Adding..." : inCart ? "Add another" : label}
    </button>
  );
}
