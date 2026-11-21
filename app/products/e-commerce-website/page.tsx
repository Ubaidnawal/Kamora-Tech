import type { Metadata } from "next";
import { ProductDetail } from "@/components/products/ProductDetail";
import { getProduct } from "@/lib/products";

const product = getProduct("e-commerce-website")!;

export const metadata: Metadata = {
  title: product.name,
  description: product.summary,
};

export default function Page() {
  return <ProductDetail product={product} />;
}
