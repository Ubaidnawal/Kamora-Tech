import { apiFetch } from "@/lib/api";
import type { ApiProduct, ApiProductList } from "@/lib/commerce";
import { products, type Product, type ProductVisualVariant } from "@/lib/products";

type ApiProductWithExtras = ApiProduct & {
  badge?: string | null;
  is_available?: boolean;
  features?: string[] | unknown[];
};

export function mapApiProduct(item: ApiProductWithExtras): Product {
  const fallback = products.find((entry) => entry.slug === item.slug);
  const image = item.images?.find((entry) => entry.is_primary) ?? item.images?.[0];
  const features = Array.isArray(item.features)
    ? item.features.filter((entry): entry is string => typeof entry === "string")
    : fallback?.features ?? [];

  return {
    slug: item.slug,
    name: item.name,
    image: image?.url || fallback?.image || "/products/custom-website-development.svg",
    category: item.category?.name || fallback?.category || "Solutions",
    categoryHref: fallback?.categoryHref || "/services/",
    summary: item.short_description || item.description || fallback?.summary || "",
    description: item.description || fallback?.description || item.short_description || "",
    features: features.length ? features : fallback?.features ?? [],
    scope: fallback?.scope ?? [],
    benefits: fallback?.benefits ?? [],
    tags: fallback?.tags ?? [],
    visual: fallback?.visual ?? ("custom-web" as ProductVisualVariant),
    badge: item.badge ?? null,
    is_available: item.is_available ?? true,
    price: item.price ?? null,
    currency: item.currency ?? "USD",
  };
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  const response = await apiFetch<ApiProductList>("/api/v1/products?featured=true&page_size=20", { skipCsrf: true });
  return (response.items ?? []).map((item) => mapApiProduct(item as ApiProductWithExtras));
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  const item = await apiFetch<ApiProductWithExtras>(`/api/v1/products/${encodeURIComponent(slug)}`, { skipCsrf: true });
  return mapApiProduct(item);
}
