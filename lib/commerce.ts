export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
};

export type ApiProductImage = {
  id: string;
  url: string;
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number;
};

export type ApiProduct = {
  id: string;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string;
  status?: string;
  is_active?: boolean;
  category?: ApiCategory | null;
  images?: ApiProductImage[];
};

export type ApiProductList = {
  items: ApiProduct[];
  total: number;
  page?: number;
  page_size?: number;
};

export type ApiCartItem = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price?: number | null;
  line_total?: number | null;
  product?: ApiProduct | null;
};

export type ApiCart = {
  id: string;
  status: string;
  items: ApiCartItem[];
  item_count: number;
  total?: number | null;
  currency?: string;
};

export type ApiOrderStatusHistory = {
  id: string;
  from_status?: string | null;
  to_status: string;
  note?: string | null;
  created_at: string;
};

export type ApiOrderItem = {
  id: string;
  product_id?: string | null;
  product_name_snapshot: string;
  unit_price?: number | null;
  quantity: number;
  line_total?: number | null;
};

export type ApiPayment = {
  id: string;
  order_id: string;
  amount?: number | null;
  currency?: string;
  status: string;
  provider?: string | null;
  provider_reference?: string | null;
  paid_at?: string | null;
  created_at: string;
};

export type ApiOrder = {
  id: string;
  order_number: string;
  tracking_id: string;
  user_id: string | null;
  product_id?: string | null;
  product_name_snapshot: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  business_name?: string | null;
  project_requirements?: string | null;
  additional_instructions?: string | null;
  amount?: number | null;
  currency?: string;
  payment_status: string;
  order_status: string;
  admin_notes?: string | null;
  items?: ApiOrderItem[];
  payments?: ApiPayment[];
  status_history?: ApiOrderStatusHistory[];
  created_at: string;
  updated_at?: string | null;
};

export type ApiTrackOrder = {
  tracking_id: string;
  order_number: string;
  order_status: string;
  payment_status: string;
  timeline: ApiOrderStatusHistory[];
  created_at: string;
  updated_at?: string | null;
};

export type ApiReviewDistribution = Record<"1" | "2" | "3" | "4" | "5", number>;

export type ApiReviewSummary = {
  product_slug: string;
  average_rating: number | null;
  review_count: number;
  distribution: ApiReviewDistribution;
  price: number | null;
  currency: string;
};

export type ApiReview = {
  id: string;
  product_id: string;
  product_slug: string;
  user_name: string;
  rating: number;
  review_text: string;
  created_at: string;
  updated_at: string;
  is_updated: boolean;
};

export type ApiReviewList = {
  items: ApiReview[];
  total: number;
  page: number;
  page_size: number;
};

export type ReviewSort = "recent" | "highest" | "lowest";

export const NO_PRICE_LABEL = "Pricing quoted after discovery";

export const EMPTY_REVIEW_DISTRIBUTION: ApiReviewDistribution = {
  "1": 0,
  "2": 0,
  "3": 0,
  "4": 0,
  "5": 0,
};

export function formatRating(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "object" && error !== null && "detail" in error) {
    const detail = (error as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
}

export function formatMoney(amount: number | null | undefined, currency = "USD") {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return NO_PRICE_LABEL;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "USD"} ${amount.toFixed(2)}`;
  }
}

export function humanizeStatus(value: string | null | undefined) {
  if (!value) return "Pending";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusClass(value: string | null | undefined) {
  const status = (value ?? "").toLowerCase();
  if (["pending", "awaiting_payment", "partially_paid", "draft"].includes(status)) {
    return "border-brass/50 bg-brass/[0.08] text-brass";
  }
  if (["confirmed", "in_progress", "under_review", "active"].includes(status)) {
    return "border-paper/30 bg-paper/[0.06] text-paper-pure";
  }
  if (["completed", "paid", "delivered"].includes(status)) {
    return "border-paper/40 bg-paper/[0.09] text-paper-pure";
  }
  return "border-white/15 bg-white/[0.02] text-paper-dim";
}

export function isActiveOrderStatus(value: string | null | undefined) {
  const status = (value ?? "").toLowerCase();
  return status === "in_progress" || status === "under_review";
}
