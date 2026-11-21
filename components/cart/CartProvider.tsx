"use client";

import Link from "next/link";
import { AlertCircle, Check, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiFetch } from "@/lib/api";
import {
  errorMessage,
  type ApiCart,
  type ApiCartItem,
  type ApiProduct,
  type ApiProductList,
} from "@/lib/commerce";
import { products, type Product } from "@/lib/products";

const STORAGE_KEY = "kamora-enquiry-cart";
const MIGRATION_KEY = "kamora-cart-migrated";
const MIGRATION_PREFIX = `${MIGRATION_KEY}:`;
const MAX_QUANTITY = 100;
const ADD_SUCCESS_MESSAGE = "Product successfully added to your cart.";

type NoticeTone = "success" | "error";
type StoredItem = { slug: string; quantity: number };

export type CartProductImage = {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
};

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string;
  price: number | null;
  currency: string;
  images: CartProductImage[];
};

export type CartItem = {
  id: string;
  slug: string;
  productId: string;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
  product: CartProduct;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number | null;
  currency: string;
  addItem: (slug: string) => void;
  removeItem: (slug: string) => void;
  increment: (slug: string) => void;
  decrement: (slug: string) => void;
  clear: () => void;
  refresh: () => Promise<void>;
  loading: boolean;
  syncing: boolean;
  error: string;
  isAuthenticated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredItems(): StoredItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const result: StoredItem[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const candidate = item as Partial<StoredItem>;
      if (typeof candidate.slug !== "string") continue;
      const slug = candidate.slug.trim();
      if (!slug || seen.has(slug)) continue;
      if (typeof candidate.quantity !== "number" || !Number.isFinite(candidate.quantity)) continue;
      const quantity = Math.floor(candidate.quantity);
      if (quantity <= 0) continue;
      seen.add(slug);
      result.push({ slug, quantity: Math.min(quantity, MAX_QUANTITY) });
    }
    return result;
  } catch {
    return [];
  }
}

function writeStoredItems(items: StoredItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    return;
  }
}

function removeStoredItems() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}

function readMigrationFlag(userId: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(`${MIGRATION_PREFIX}${userId}`) === "true";
  } catch {
    return false;
  }
}

function writeMigrationFlag(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${MIGRATION_PREFIX}${userId}`, "true");
  } catch {
    return;
  }
}

function clearMigrationFlags() {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(MIGRATION_PREFIX)) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    return;
  }
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() ?? "";
}

function readApiPrice(product: ApiProduct | null | undefined) {
  return typeof product?.price === "number" && Number.isFinite(product.price) ? product.price : null;
}

function localProduct(identifier: string) {
  return products.find((product) => product.slug === identifier);
}

function mapProductImages(product: ApiProduct | null | undefined): CartProductImage[] {
  return (product?.images ?? [])
    .filter((image) => image && typeof image.url === "string" && image.url.trim().length > 0)
    .slice()
    .sort((a, b) => Number(Boolean(b.is_primary)) - Number(Boolean(a.is_primary)) || (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt_text ?? "",
      isPrimary: Boolean(image.is_primary),
    }));
}

function mapApiProduct(product: ApiProduct | null | undefined, productId: string, fallback?: Product): CartProduct {
  const slug = firstText(product?.slug, fallback?.slug) || productId;
  return {
    id: firstText(product?.id, productId) || productId,
    slug,
    name: firstText(product?.name, fallback?.name) || "Product",
    category: firstText(product?.category?.name, fallback?.category) || "Kamora solution",
    summary: firstText(product?.short_description, product?.description, fallback?.summary),
    price: readApiPrice(product),
    currency: firstText(product?.currency) || "USD",
    images: mapProductImages(product),
  };
}

function findFallbackProduct(product: ApiProduct | null | undefined, productId: string) {
  return localProduct(firstText(product?.slug) || productId);
}

function matchesItem(item: ApiCartItem, identifier: string) {
  return item.id === identifier || item.product_id === identifier || item.product?.slug === identifier;
}

function mapApiCart(cart: ApiCart) {
  const items: CartItem[] = (cart.items ?? []).map((item) => {
    const fallback = findFallbackProduct(item.product, item.product_id);
    const productId = firstText(item.product_id, item.product?.id) || item.id;
    return {
      id: item.id,
      slug: firstText(item.product?.slug, fallback?.slug) || productId,
      productId,
      quantity: item.quantity,
      unitPrice: typeof item.unit_price === "number" && Number.isFinite(item.unit_price) ? item.unit_price : null,
      lineTotal: typeof item.line_total === "number" && Number.isFinite(item.line_total) ? item.line_total : null,
      product: mapApiProduct(item.product, productId, fallback),
    };
  });

  return {
    items,
    count: typeof cart.item_count === "number" ? cart.item_count : items.reduce((sum, item) => sum + item.quantity, 0),
    total: typeof cart.total === "number" && Number.isFinite(cart.total) ? cart.total : null,
    currency: firstText(cart.currency) || "USD",
  };
}

function mapStoredItems(storedItems: StoredItem[], catalog: Map<string, ApiProduct> | null): CartItem[] {
  return storedItems.flatMap((item) => {
    const local = localProduct(item.slug);
    const apiProduct = catalog?.get(item.slug) ?? null;
    if (!local && !apiProduct) return [];
    const price = readApiPrice(apiProduct);
    const productId = firstText(apiProduct?.id) || item.slug;
    return [
      {
        id: productId,
        slug: firstText(apiProduct?.slug, local?.slug) || item.slug,
        productId,
        quantity: item.quantity,
        unitPrice: price,
        lineTotal: price === null ? null : Math.round(price * item.quantity * 100) / 100,
        product: {
          id: productId,
          slug: firstText(apiProduct?.slug, local?.slug) || item.slug,
          name: firstText(apiProduct?.name, local?.name) || "Product",
          category: firstText(apiProduct?.category?.name, local?.category) || "Kamora solution",
          summary: firstText(apiProduct?.short_description, apiProduct?.description, local?.summary),
          price,
          currency: firstText(apiProduct?.currency) || "USD",
          images: mapProductImages(apiProduct),
        },
      },
    ];
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [storedItems, setStoredItems] = useState<StoredItem[]>([]);
  const [remoteCart, setRemoteCart] = useState<ApiCart | null>(null);
  const [catalog, setCatalog] = useState<Map<string, ApiProduct> | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [noticeTone, setNoticeTone] = useState<NoticeTone>("success");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catalogRef = useRef<Map<string, ApiProduct> | null>(null);
  const migrationRef = useRef<string | null>(null);
  const storedItemsRef = useRef<StoredItem[]>([]);
  const remoteCartRef = useRef<ApiCart | null>(null);
  const mutationChainRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    setStoredItems(readStoredItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    storedItemsRef.current = storedItems;
    if (!hydrated || isAuthenticated) return;
    writeStoredItems(storedItems);
  }, [hydrated, isAuthenticated, storedItems]);

  useEffect(() => {
    remoteCartRef.current = remoteCart;
  }, [remoteCart]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const announce = useCallback((text: string, tone: NoticeTone = "success") => {
    setMessage(text);
    setNoticeTone(tone);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 3200);
  }, []);

  const reportError = useCallback(
    (value: unknown) => {
      const text = errorMessage(value);
      setError(text);
      announce(text, "error");
    },
    [announce],
  );

  const queueMutation = useCallback((task: () => Promise<void>) => {
    const next = mutationChainRef.current.then(task).catch(() => undefined);
    mutationChainRef.current = next;
    return next;
  }, []);

  const loadCatalog = useCallback(async () => {
    if (catalogRef.current) return catalogRef.current;
    const data = await apiFetch<ApiProductList>("/api/v1/products?page_size=100");
    const map = new Map<string, ApiProduct>();
    for (const product of Array.isArray(data.items) ? data.items : []) {
      if (product.id) map.set(product.id, product);
      if (product.slug) map.set(product.slug, product);
    }
    catalogRef.current = map;
    setCatalog(map);
    return map;
  }, []);

  useEffect(() => {
    if (!hydrated || authLoading || isAuthenticated) return;
    void loadCatalog().catch(() => undefined);
  }, [authLoading, hydrated, isAuthenticated, loadCatalog]);

  const resolveProduct = useCallback(
    async (identifier: string) => {
      const catalog = await loadCatalog();
      const cached = catalog.get(identifier);
      if (cached?.id) return cached;
      const product = await apiFetch<ApiProduct>(`/api/v1/products/${encodeURIComponent(identifier)}`);
      if (!product?.id) throw new Error("This product is not available in the catalog.");
      catalog.set(product.id, product);
      if (product.slug) catalog.set(product.slug, product);
      return product;
    },
    [loadCatalog],
  );

  const loadRemoteCart = useCallback(async () => {
    const cart = await apiFetch<ApiCart>("/api/v1/cart");
    setRemoteCart(cart);
    remoteCartRef.current = cart;
    return cart;
  }, []);

  const withRemote = useCallback(
    async (operation: () => Promise<ApiCart>) => {
      setLoading(true);
      setError("");
      try {
        const cart = await operation();
        setRemoteCart(cart);
        remoteCartRef.current = cart;
        return cart;
      } catch (value) {
        reportError(value);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [reportError],
  );

  useEffect(() => {
    if (!hydrated || authLoading) return;

    if (!isAuthenticated || !user) {
      migrationRef.current = null;
      clearMigrationFlags();
      setRemoteCart(null);
      remoteCartRef.current = null;
      setError("");
      return;
    }

    const userId = user.id;
    const run = async () => {
      setSyncing(true);
      setError("");
      try {
        if (migrationRef.current !== userId && !readMigrationFlag(userId)) {
          migrationRef.current = userId;
          const local = storedItemsRef.current;
          if (local.length > 0) {
            for (const item of local) {
              const product = await resolveProduct(item.slug);
              await apiFetch<ApiCart>("/api/v1/cart/items", {
                method: "POST",
                body: JSON.stringify({ product_id: product.id, quantity: Math.min(Math.max(item.quantity, 1), MAX_QUANTITY) }),
              });
            }
            setStoredItems([]);
            storedItemsRef.current = [];
            removeStoredItems();
            writeMigrationFlag(userId);
            announce("Your cart was synced to your account");
          }
        }
        await loadRemoteCart();
      } catch (value) {
        migrationRef.current = null;
        reportError(value);
      } finally {
        setSyncing(false);
      }
    };

    void run();
  }, [announce, authLoading, hydrated, isAuthenticated, loadRemoteCart, reportError, resolveProduct, user]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setRemoteCart(null);
      remoteCartRef.current = null;
      return;
    }
    setLoading(true);
    setError("");
    try {
      await loadRemoteCart();
    } catch (value) {
      reportError(value);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadRemoteCart, reportError]);

  const addItem = useCallback(
    (slug: string) => {
      if (!slug) return;

      if (isAuthenticated) {
        void queueMutation(async () => {
          try {
            const current = remoteCartRef.current?.items.find((entry) => matchesItem(entry, slug));
            if (current && current.quantity >= MAX_QUANTITY) {
              announce("Maximum quantity reached", "error");
              return;
            }
            const product = await resolveProduct(slug);
            const cart = await withRemote(() =>
              apiFetch<ApiCart>("/api/v1/cart/items", {
                method: "POST",
                body: JSON.stringify({ product_id: product.id, quantity: 1 }),
              }),
            );
            if (cart) announce(ADD_SUCCESS_MESSAGE);
          } catch (value) {
            reportError(value);
          }
        });
        return;
      }

      const existing = storedItems.find((item) => item.slug === slug);
      if (existing && existing.quantity >= MAX_QUANTITY) {
        announce("Maximum quantity reached", "error");
        return;
      }
      setStoredItems((current) => {
        const found = current.find((item) => item.slug === slug);
        if (found) {
          return current.map((item) =>
            item.slug === slug ? { ...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY) } : item,
          );
        }
        return [...current, { slug, quantity: 1 }];
      });
      announce(ADD_SUCCESS_MESSAGE);
    },
    [announce, isAuthenticated, queueMutation, reportError, resolveProduct, storedItems, withRemote],
  );

  const removeItem = useCallback(
    (slug: string) => {
      if (!slug) return;

      if (isAuthenticated) {
        void queueMutation(async () => {
          const item = remoteCartRef.current?.items.find((entry) => matchesItem(entry, slug));
          if (!item) return;
          const cart = await withRemote(() =>
            apiFetch<ApiCart>(`/api/v1/cart/items/${encodeURIComponent(item.id)}`, { method: "DELETE" }),
          );
          if (cart) announce("Removed from your cart");
        });
        return;
      }

      setStoredItems((current) => current.filter((item) => item.slug !== slug));
      announce("Removed from your cart");
    },
    [announce, isAuthenticated, queueMutation, withRemote],
  );

  const increment = useCallback(
    (slug: string) => {
      if (!slug) return;

      if (isAuthenticated) {
        void queueMutation(async () => {
          const item = remoteCartRef.current?.items.find((entry) => matchesItem(entry, slug));
          if (!item) return;
          if (item.quantity >= MAX_QUANTITY) {
            announce("Maximum quantity reached", "error");
            return;
          }
          const cart = await withRemote(() =>
            apiFetch<ApiCart>(`/api/v1/cart/items/${encodeURIComponent(item.id)}`, {
              method: "PUT",
              body: JSON.stringify({ quantity: item.quantity + 1 }),
            }),
          );
          if (cart) announce("Quantity updated");
        });
        return;
      }

      const current = storedItems.find((item) => item.slug === slug);
      if (!current) return;
      if (current.quantity >= MAX_QUANTITY) {
        announce("Maximum quantity reached", "error");
        return;
      }
      setStoredItems((items) =>
        items.map((item) => (item.slug === slug ? { ...item, quantity: Math.min(item.quantity + 1, MAX_QUANTITY) } : item)),
      );
      announce("Quantity updated");
    },
    [announce, isAuthenticated, queueMutation, storedItems, withRemote],
  );

  const decrement = useCallback(
    (slug: string) => {
      if (!slug) return;

      if (isAuthenticated) {
        void queueMutation(async () => {
          const item = remoteCartRef.current?.items.find((entry) => matchesItem(entry, slug));
          if (!item) return;
          if (item.quantity <= 1) {
            const cart = await withRemote(() =>
              apiFetch<ApiCart>(`/api/v1/cart/items/${encodeURIComponent(item.id)}`, { method: "DELETE" }),
            );
            if (cart) announce("Removed from your cart");
            return;
          }
          const cart = await withRemote(() =>
            apiFetch<ApiCart>(`/api/v1/cart/items/${encodeURIComponent(item.id)}`, {
              method: "PUT",
              body: JSON.stringify({ quantity: item.quantity - 1 }),
            }),
          );
          if (cart) announce("Quantity updated");
        });
        return;
      }

      const current = storedItems.find((item) => item.slug === slug);
      if (!current) return;
      if (current.quantity <= 1) {
        setStoredItems((items) => items.filter((item) => item.slug !== slug));
        announce("Removed from your cart");
        return;
      }
      setStoredItems((items) => items.map((item) => (item.slug === slug ? { ...item, quantity: item.quantity - 1 } : item)));
      announce("Quantity updated");
    },
    [announce, isAuthenticated, queueMutation, storedItems, withRemote],
  );

  const clear = useCallback(() => {
    if (!isAuthenticated) {
      setStoredItems([]);
      announce("Cart cleared");
      return;
    }

    const items = [...(remoteCartRef.current?.items ?? [])];
    void queueMutation(async () => {
      setLoading(true);
      setSyncing(true);
      setError("");
      try {
        for (const item of items) {
          await apiFetch<ApiCart>(`/api/v1/cart/items/${encodeURIComponent(item.id)}`, { method: "DELETE" });
        }
        await loadRemoteCart();
        announce("Cart cleared");
      } catch (value) {
        reportError(value);
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    });
  }, [announce, isAuthenticated, loadRemoteCart, queueMutation, reportError]);

  const mappedRemote = useMemo(() => mapApiCart(remoteCart ?? { items: [], item_count: 0, total: null, currency: "USD", id: "", status: "active" }), [remoteCart]);
  const localItems = useMemo(() => mapStoredItems(storedItems, catalog), [catalog, storedItems]);
  const items = isAuthenticated ? mappedRemote.items : localItems;
  const count = isAuthenticated ? mappedRemote.count : localItems.reduce((sum, item) => sum + item.quantity, 0);
  const localTotal =
    localItems.length > 0 && localItems.every((item) => item.lineTotal !== null)
      ? Math.round(localItems.reduce((sum, item) => sum + (item.lineTotal ?? 0), 0) * 100) / 100
      : null;
  const total = isAuthenticated ? mappedRemote.total : localTotal;
  const currency = isAuthenticated ? mappedRemote.currency : localItems[0]?.product.currency || "USD";

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      total,
      currency,
      addItem,
      removeItem,
      increment,
      decrement,
      clear,
      refresh,
      loading: authLoading || loading || syncing,
      syncing,
      error,
      isAuthenticated,
    }),
    [addItem, authLoading, clear, count, currency, decrement, error, increment, isAuthenticated, items, loading, refresh, removeItem, syncing, total],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2" aria-live="polite" aria-atomic="true">
        {message && (
          <div
            className={`pointer-events-auto flex items-center justify-between gap-4 border bg-background px-5 py-4 shadow-2xl shadow-black/60 ${
              noticeTone === "error" ? "border-red-500/70" : "border-brass"
            }`}
          >
            <span className="flex items-center gap-3 font-sans text-xs text-paper-pure">
              {noticeTone === "error" ? (
                <AlertCircle size={16} aria-hidden="true" className="text-red-400" />
              ) : (
                <Check size={16} aria-hidden="true" className="text-brass" />
              )}
              {message}
            </span>
            <div className="flex items-center gap-4">
              <Link href="/cart/" className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
                View cart
              </Link>
              <button type="button" onClick={() => setMessage("")} aria-label="Dismiss notification" className="text-paper-faint transition-colors hover:text-paper-pure">
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
