"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  AdminBanner,
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  ConfirmDialog,
  DateText,
  Money,
  PaginationControls,
  ResponsiveTable,
  StatusBadge,
} from "./AdminPrimitives";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  inputClass,
  labelClass,
  noteClass,
  textareaClass,
} from "./adminStyles";
import type { AdminProduct, AdminProductList, AdminProductPayload, Category, ProductImage, ProductStatus } from "./types";
import { useAdminMutation } from "./useAdminMutation";
import { useAdminResource } from "./useAdminResource";

const statusOptions: ProductStatus[] = ["draft", "active", "archived"];

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageBytes = 5 * 1024 * 1024;

type ProductFormState = {
  name: string;
  slug: string;
  category_id: string;
  short_description: string;
  description: string;
  features: string;
  specifications: string;
  price: string;
  currency: string;
  badge: string;
  is_available: boolean;
  status: ProductStatus;
  is_active: boolean;
  is_featured: boolean;
  sort_order: string;
};

type ImageDraft = {
  alt_text: string;
  sort_order: string;
};

type DeleteTarget =
  | { kind: "product"; product: AdminProduct }
  | { kind: "image"; product: AdminProduct; image: ProductImage }
  | null;

const emptyForm: ProductFormState = {
  name: "",
  slug: "",
  category_id: "",
  short_description: "",
  description: "",
  features: "[]",
  specifications: "{}",
  price: "",
  currency: "USD",
  badge: "",
  is_available: true,
  status: "active",
  is_active: true,
  is_featured: false,
  sort_order: "0",
};

export function ProductsPanel() {
  const [page, setPage] = useState(1);
  const products = useAdminResource<AdminProductList>(`/api/v1/admin/products?page=${page}&page_size=20`);
  const categories = useAdminResource<Category[]>("/api/v1/admin/categories");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [imageDrafts, setImageDrafts] = useState<Record<string, ImageDraft>>({});
  const [formError, setFormError] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mutation = useAdminMutation();

  const items = products.data?.items ?? [];
  const editingProduct = editingId ? items.find((item) => item.id === editingId) ?? null : null;
  const total = products.data?.total ?? 0;
  const pageSize = products.data?.page_size ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (formOpen) return;
    setFormError("");
  }, [formOpen]);

  const setField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setImageDrafts({});
    setUploadFile(null);
    setUploadError("");
    mutation.clearMessages();
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFormOpen(true);
  };

  const openEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      slug: product.slug,
      category_id: product.category_id ?? "",
      short_description: product.short_description ?? "",
      description: product.description ?? "",
      features: JSON.stringify(product.features ?? [], null, 2),
      specifications: JSON.stringify(product.specifications ?? {}, null, 2),
      price: product.price === null || product.price === undefined ? "" : String(product.price),
      currency: product.currency,
      badge: product.badge ?? "",
      is_available: product.is_available ?? true,
      status: product.status,
      is_active: product.is_active,
      is_featured: product.is_featured,
      sort_order: String(product.sort_order),
    });
    setImageDrafts(
      Object.fromEntries(
        (product.images ?? []).map((image) => [image.id, { alt_text: image.alt_text ?? "", sort_order: String(image.sort_order) }]),
      ),
    );
    setFormError("");
    setUploadFile(null);
    setUploadError("");
    mutation.clearMessages();
    if (fileInputRef.current) fileInputRef.current.value = "";
    setFormOpen(true);
  };

  const buildPayload = (): AdminProductPayload | null => {
    try {
      const features = form.features.trim() ? JSON.parse(form.features) : [];
      if (!Array.isArray(features)) throw new Error("Features must be a JSON array.");

      const parsedSpecifications = form.specifications.trim() ? JSON.parse(form.specifications) : {};
      if (
        typeof parsedSpecifications !== "object" ||
        parsedSpecifications === null ||
        Array.isArray(parsedSpecifications)
      ) {
        throw new Error("Specifications must be a JSON object.");
      }

      const price = form.price.trim() ? Number(form.price) : null;
      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        throw new Error("Price must be zero or greater.");
      }

      const sortOrder = Number(form.sort_order || "0");
      if (!Number.isInteger(sortOrder)) throw new Error("Sort order must be a whole number.");

      if (form.name.trim().length < 2) throw new Error("Name must contain at least two characters.");
      if (form.currency.trim().length !== 3) throw new Error("Currency must be a three-letter code.");

      return {
        name: form.name.trim(),
        slug: form.slug.trim() || null,
        category_id: form.category_id || null,
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        features,
        specifications: parsedSpecifications as Record<string, unknown>,
        price,
        currency: form.currency.trim().toUpperCase(),
        badge: form.badge.trim() || null,
        is_available: form.is_available,
        status: form.status,
        is_active: form.is_active,
        is_featured: form.is_featured,
        sort_order: sortOrder,
      };
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "The product form could not be validated.");
      return null;
    }
  };

  const saveProduct = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setFormError("");
    const result = await mutation.run(
      editingId ? `${editingId}:save` : "new:save",
      () =>
        editingId
          ? apiFetch<AdminProduct>(`/api/v1/admin/products/${editingId}`, { method: "PUT", body: JSON.stringify(payload) })
          : apiFetch<AdminProduct>("/api/v1/admin/products", { method: "POST", body: JSON.stringify(payload) }),
      editingId ? "Product updated." : "Product created.",
    );
    if (result) {
      setFormOpen(false);
      products.reload();
    }
  };

  const uploadImage = async (product: AdminProduct) => {
    if (!uploadFile) {
      setUploadError("Choose a JPG, PNG or WEBP image first.");
      return;
    }
    if (!allowedImageTypes.includes(uploadFile.type)) {
      setUploadError("Only JPG, PNG and WEBP images are accepted.");
      return;
    }
    if (uploadFile.size > maxImageBytes) {
      setUploadError("Images must be 5MB or smaller.");
      return;
    }

    setUploadError("");
    const body = new FormData();
    body.append("file", uploadFile);
    const uploaded = await mutation.run(
      `${product.id}:upload`,
      () => apiFetch<ProductImage>(`/api/v1/admin/products/${product.id}/images`, { method: "POST", body }),
      "Image uploaded.",
    );
    if (uploaded) {
      patchProductImages(product.id, (current) => [...current, uploaded]);
      setImageDrafts((current) => ({ ...current, [uploaded.id]: { alt_text: uploaded.alt_text ?? "", sort_order: String(uploaded.sort_order) } }));
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const patchProductImages = (productId: string, update: (images: ProductImage[]) => ProductImage[]) => {
    products.setData((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) => (item.id === productId ? { ...item, images: update(item.images ?? []) } : item)),
          }
        : current,
    );
  };

  const saveImage = async (product: AdminProduct, image: ProductImage) => {
    const draft = imageDrafts[image.id] ?? { alt_text: image.alt_text ?? "", sort_order: String(image.sort_order) };
    const sortOrder = Number(draft.sort_order);
    if (!Number.isInteger(sortOrder)) {
      mutation.setError("Sort order must be a whole number.");
      return;
    }
    const updated = await mutation.run(
      `${image.id}:save`,
      () =>
        apiFetch<ProductImage>(`/api/v1/admin/products/${product.id}/images/${image.id}`, {
          method: "PATCH",
          body: JSON.stringify({ alt_text: draft.alt_text.trim() || null, sort_order: sortOrder }),
        }),
      "Image updated.",
    );
    if (updated) {
      patchProductImages(product.id, (current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    }
  };

  const setPrimary = async (product: AdminProduct, image: ProductImage) => {
    if (image.is_primary) return;
    const updated = await mutation.run(
      `${image.id}:primary`,
      () =>
        apiFetch<ProductImage>(`/api/v1/admin/products/${product.id}/images/${image.id}`, {
          method: "PATCH",
          body: JSON.stringify({ is_primary: true }),
        }),
      "Primary image updated.",
    );
    if (updated) {
      patchProductImages(product.id, (current) =>
        current.map((entry) => ({ ...entry, is_primary: entry.id === updated.id })),
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "product") {
      const product = deleteTarget.product;
      const result = await mutation.run(
        `${product.id}:delete`,
        () => apiFetch<{ message?: string }>(`/api/v1/admin/products/${product.id}`, { method: "DELETE" }),
        `Product ${product.name} deleted.`,
      );
      if (result) {
        setDeleteTarget(null);
        products.reload();
      }
      return;
    }

    const { product, image } = deleteTarget;
    const result = await mutation.run(
      `${image.id}:delete`,
      () => apiFetch<{ message?: string }>(`/api/v1/admin/products/${product.id}/images/${image.id}`, { method: "DELETE" }),
      "Image deleted.",
    );
    if (result) {
      patchProductImages(product.id, (current) => current.filter((entry) => entry.id !== image.id));
      setImageDrafts((current) => {
        const next = { ...current };
        delete next[image.id];
        return next;
      });
      setDeleteTarget(null);
    }
  };

  if (products.loading || categories.loading) return <AdminLoadingBlock label="Loading catalog" />;

  const loadError = products.error || categories.error;
  if (loadError) return <AdminErrorBlock message={loadError} onRetry={() => { products.reload(); categories.reload(); }} />;

  return (
    <div className="space-y-6">
      <AdminBanner message={mutation.success} tone="success" onDismiss={mutation.clearMessages} />
      <AdminBanner message={mutation.error} tone="error" onDismiss={mutation.clearMessages} />

      <AdminPanel
        title="Catalog controls"
        description="Products are read from the admin catalog endpoint. Badges, availability and image controls are saved through the documented admin routes."
        action={
          <button type="button" onClick={openCreate} className={buttonPrimaryClass}>
            New product
          </button>
        }
      >
        <p className={noteClass}>
          Upload JPG, PNG or WEBP images up to 5MB. Set a primary image, edit alt text and sort order, or delete images from the edit form.
        </p>
      </AdminPanel>

      {formOpen && (
        <AdminPanel
          title={editingId ? "Edit product" : "Create product"}
          description="Badge and availability control how the product appears on the public website."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className={labelClass}>Name</span>
              <input value={form.name} onChange={(event) => setField("name", event.target.value)} className={`${inputClass} mt-2`} />
            </label>
            <label>
              <span className={labelClass}>Slug (optional)</span>
              <input value={form.slug} onChange={(event) => setField("slug", event.target.value)} className={`${inputClass} mt-2`} />
            </label>
            <label>
              <span className={labelClass}>Category</span>
              <select value={form.category_id} onChange={(event) => setField("category_id", event.target.value)} className={`${inputClass} mt-2`}>
                <option value="">No category</option>
                {(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClass}>Badge (optional)</span>
              <input value={form.badge} onChange={(event) => setField("badge", event.target.value)} placeholder="e.g. Popular" className={`${inputClass} mt-2`} />
            </label>
            <label>
              <span className={labelClass}>Price</span>
              <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setField("price", event.target.value)} className={`${inputClass} mt-2`} />
            </label>
            <label>
              <span className={labelClass}>Currency</span>
              <input maxLength={3} value={form.currency} onChange={(event) => setField("currency", event.target.value.toUpperCase())} className={`${inputClass} mt-2`} />
            </label>
            <label>
              <span className={labelClass}>Status</span>
              <select value={form.status} onChange={(event) => setField("status", event.target.value as ProductStatus)} className={`${inputClass} mt-2`}>
                {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label>
              <span className={labelClass}>Sort order</span>
              <input type="number" value={form.sort_order} onChange={(event) => setField("sort_order", event.target.value)} className={`${inputClass} mt-2`} />
            </label>
            <div className="flex flex-wrap items-end gap-6 pb-1 md:col-span-2">
              <label className="flex items-center gap-2 font-sans text-xs text-[#000000]">
                <input type="checkbox" checked={form.is_available} onChange={(event) => setField("is_available", event.target.checked)} className="h-4 w-4 accent-[#B00020]" />
                Available to customers
              </label>
              <label className="flex items-center gap-2 font-sans text-xs text-[#000000]">
                <input type="checkbox" checked={form.is_active} onChange={(event) => setField("is_active", event.target.checked)} className="h-4 w-4 accent-[#B00020]" />
                Active
              </label>
              <label className="flex items-center gap-2 font-sans text-xs text-[#000000]">
                <input type="checkbox" checked={form.is_featured} onChange={(event) => setField("is_featured", event.target.checked)} className="h-4 w-4 accent-[#B00020]" />
                Featured
              </label>
            </div>
            <label className="md:col-span-2">
              <span className={labelClass}>Short description</span>
              <input maxLength={500} value={form.short_description} onChange={(event) => setField("short_description", event.target.value)} className={`${inputClass} mt-2`} />
            </label>
            <label className="md:col-span-2">
              <span className={labelClass}>Description</span>
              <textarea rows={4} value={form.description} onChange={(event) => setField("description", event.target.value)} className={`${textareaClass} mt-2`} />
            </label>
            <label className="md:col-span-2">
              <span className={labelClass}>Features (JSON array)</span>
              <textarea rows={4} value={form.features} onChange={(event) => setField("features", event.target.value)} className={`${textareaClass} mt-2`} />
            </label>
            <label className="md:col-span-2">
              <span className={labelClass}>Specifications (JSON object)</span>
              <textarea rows={4} value={form.specifications} onChange={(event) => setField("specifications", event.target.value)} className={`${textareaClass} mt-2`} />
            </label>

            <div className="md:col-span-2 border-t border-[#E5E5E5] pt-4">
              <span className={labelClass}>Images</span>
              {editingProduct ? (
                <div className="mt-3 space-y-3">
                  {editingProduct.images?.length ? (
                    editingProduct.images.map((image) => {
                      const draft = imageDrafts[image.id] ?? { alt_text: image.alt_text ?? "", sort_order: String(image.sort_order) };
                      return (
                        <div key={image.id} className={`${cardClass} grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto]`}>
                          <div className="min-w-0">
                            <p className="truncate font-sans text-[11px] text-[#555555]">{image.url}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {image.is_primary && <StatusBadge value="primary" tone="success" />}
                              <button type="button" onClick={() => void setPrimary(editingProduct, image)} disabled={image.is_primary || Boolean(mutation.busyKey)} className="border border-[#B00020] px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.12em] text-[#B00020] disabled:opacity-40">
                                {image.is_primary ? "Primary" : "Set primary"}
                              </button>
                            </div>
                          </div>
                          <label>
                            <span className={labelClass}>Alt text</span>
                            <input value={draft.alt_text} onChange={(event) => setImageDrafts((current) => ({ ...current, [image.id]: { ...draft, alt_text: event.target.value } }))} className={`${inputClass} mt-2`} />
                          </label>
                          <label>
                            <span className={labelClass}>Sort order</span>
                            <input type="number" value={draft.sort_order} onChange={(event) => setImageDrafts((current) => ({ ...current, [image.id]: { ...draft, sort_order: event.target.value } }))} className={`${inputClass} mt-2`} />
                          </label>
                          <div className="flex items-end gap-2 sm:flex-col sm:items-stretch">
                            <button type="button" onClick={() => void saveImage(editingProduct, image)} disabled={Boolean(mutation.busyKey)} className={buttonSecondaryClass}>Save</button>
                            <button type="button" onClick={() => setDeleteTarget({ kind: "image", product: editingProduct, image })} className={buttonPrimaryClass}>Delete</button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className={noteClass}>No images recorded for this product.</p>
                  )}

                  <div className="grid gap-4 border-t border-[#E5E5E5] pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
                    <label>
                      <span className={labelClass}>Upload image (JPG, PNG or WEBP, max 5MB)</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => { setUploadFile(event.target.files?.[0] ?? null); setUploadError(""); }}
                        className={`${inputClass} mt-2 file:mr-3 file:border-0 file:bg-[#B00020] file:px-3 file:py-1.5 file:font-sans file:text-[10px] file:uppercase file:tracking-[0.14em] file:text-[#FFFFFF]`}
                      />
                    </label>
                    <button type="button" onClick={() => void uploadImage(editingProduct)} disabled={!uploadFile || Boolean(mutation.busyKey)} className={buttonSecondaryClass}>
                      {mutation.busyKey === `${editingProduct.id}:upload` ? "Uploading" : "Upload image"}
                    </button>
                  </div>
                  {uploadError && <p role="alert" className={`${noteClass} text-[#B00020]`}>{uploadError}</p>}
                </div>
              ) : (
                <p className={`${noteClass} mt-2`}>Create the product before uploading or editing images.</p>
              )}
            </div>
          </div>

          {formError && <div role="alert" className={`${cardClass} mt-5 border-[#B00020]/40 text-sm text-[#B00020]`}>{formError}</div>}

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => void saveProduct()} disabled={Boolean(mutation.busyKey)} className={buttonPrimaryClass}>
              {mutation.busyKey?.endsWith(":save") ? "Saving" : editingId ? "Save changes" : "Create product"}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} disabled={Boolean(mutation.busyKey)} className={buttonSecondaryClass}>Cancel</button>
          </div>
        </AdminPanel>
      )}

      <AdminPanel title="Products" description={`${total} catalog records returned by the API.`}>
        <ResponsiveTable
          columns={[
            { key: "product", label: "Product" },
            { key: "category", label: "Category" },
            { key: "price", label: "Price" },
            { key: "badge", label: "Badge" },
            { key: "availability", label: "Availability" },
            { key: "status", label: "Status" },
            { key: "updated", label: "Updated" },
            { key: "actions", label: "Actions" },
          ]}
          rows={items}
          rowKey={(product) => product.id}
          empty={<AdminEmptyBlock title="No products found" description="Create a product using the controls above." />}
          renderCell={(product, key) => {
            if (key === "product") {
              return (
                <div>
                  <p className="font-sans text-sm font-semibold text-[#000000]">{product.name}</p>
                  <p className="mt-1 font-sans text-[10px] text-[#666666]">{product.slug}</p>
                  {product.is_deleted && <p className="mt-1 font-sans text-[10px] uppercase tracking-widest text-[#B00020]">Deleted</p>}
                </div>
              );
            }
            if (key === "category") return <span className="font-sans text-xs text-[#444444]">{product.category?.name ?? "—"}</span>;
            if (key === "price") return <span className="font-sans text-sm"><Money value={product.price} currency={product.currency} /></span>;
            if (key === "badge") return product.badge ? <StatusBadge value={product.badge} tone="info" /> : <span className="font-sans text-xs text-[#888888]">—</span>;
            if (key === "availability") return <StatusBadge value={product.is_available === false ? "unavailable" : "available"} />;
            if (key === "status") {
              return (
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge value={product.status} />
                  <StatusBadge value={product.is_active ? "active" : "inactive"} />
                  {product.is_featured && <StatusBadge value="featured" tone="info" />}
                </div>
              );
            }
            if (key === "updated") return <DateText value={product.updated_at ?? product.created_at} withTime />;
            return (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => openEdit(product)} disabled={product.is_deleted} className="border border-[#000000] px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#000000] hover:border-[#B00020] hover:text-[#B00020] disabled:opacity-40">Edit</button>
                <button type="button" onClick={() => setDeleteTarget({ kind: "product", product })} disabled={product.is_deleted || Boolean(mutation.busyKey)} className="border border-[#B00020] px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#B00020] hover:bg-[#B00020] hover:text-[#FFFFFF] disabled:opacity-40">Delete</button>
              </div>
            );
          }}
          renderCard={(product) => (
            <div className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-sm font-semibold text-[#000000]">{product.name}</p>
                  <p className="mt-1 font-sans text-[10px] text-[#666666]">{product.slug}</p>
                </div>
                <div className="flex flex-wrap gap-1.5"><StatusBadge value={product.status} /><StatusBadge value={product.is_available === false ? "unavailable" : "available"} /></div>
              </div>
              <div className="mt-4 grid gap-2 font-sans text-xs text-[#555555]">
                <p>{product.category?.name ?? "No category"}</p>
                <p><Money value={product.price} currency={product.currency} /></p>
                {product.badge && <p>Badge: {product.badge}</p>}
                <p>Updated <DateText value={product.updated_at ?? product.created_at} withTime /></p>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => openEdit(product)} disabled={product.is_deleted} className={buttonSecondaryClass}>Edit</button>
                <button type="button" onClick={() => setDeleteTarget({ kind: "product", product })} disabled={product.is_deleted || Boolean(mutation.busyKey)} className={buttonPrimaryClass}>Delete</button>
              </div>
            </div>
          )}
        />
        <PaginationControls page={products.data?.page ?? page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </AdminPanel>

      <AdminPanel title="Category reference" description="Categories available for product assignment. Manage them from the Categories page.">
        <div className="flex flex-wrap gap-2">
          {(categories.data ?? []).map((category) => <StatusBadge key={category.id} value={category.name} />)}
          {(categories.data ?? []).length === 0 && <p className="font-sans text-xs text-[#666666]">No categories returned.</p>}
        </div>
      </AdminPanel>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.kind === "image" ? "Delete image" : "Delete product"}
        message={
          deleteTarget?.kind === "image"
            ? `Remove image ${deleteTarget.image.url} from ${deleteTarget.product.name}?`
            : `Soft-delete "${deleteTarget?.product.name ?? ""}"? The record will remain in the database.`
        }
        confirmLabel={deleteTarget?.kind === "image" ? "Delete image" : "Delete product"}
        busy={Boolean(mutation.busyKey?.endsWith(":delete"))}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
