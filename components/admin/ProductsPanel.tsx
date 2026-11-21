"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  AdminEmptyBlock,
  AdminErrorBlock,
  AdminLoadingBlock,
  AdminPanel,
  DateText,
  Money,
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
  status: ProductStatus;
  is_active: boolean;
  is_featured: boolean;
  sort_order: string;
};

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
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const items = products.data?.items ?? [];
  const editingProduct = editingId ? items.find((item) => item.id === editingId) ?? null : null;
  const total = products.data?.total ?? 0;
  const pageSize = products.data?.page_size ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (formOpen) return;
    setFormError("");
    setActionError("");
  }, [formOpen]);

  const setField = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setUploadFile(null);
    setUploadError("");
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
      status: product.status,
      is_active: product.is_active,
      is_featured: product.is_featured,
      sort_order: String(product.sort_order),
    });
    setFormError("");
    setUploadFile(null);
    setUploadError("");
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

    setSaving(true);
    setFormError("");
    setActionError("");

    try {
      if (editingId) {
        await apiFetch(`/api/v1/admin/products/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/v1/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setFormOpen(false);
      products.reload();
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "The product could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product: AdminProduct) => {
    if (!window.confirm(`Soft-delete "${product.name}"? The record will remain in the database.`)) return;
    setDeletingId(product.id);
    setActionError("");

    try {
      await apiFetch(`/api/v1/admin/products/${product.id}`, { method: "DELETE" });
      products.reload();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "The product could not be deleted.");
    } finally {
      setDeletingId(null);
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

    setUploadingId(product.id);
    setUploadError("");
    try {
      const body = new FormData();
      body.append("file", uploadFile);
      const uploaded = await apiFetch<ProductImage>(`/api/v1/admin/products/${product.id}/images`, {
        method: "POST",
        body,
      });
      products.setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === product.id ? { ...item, images: [...item.images, uploaded] } : item,
              ),
            }
          : current,
      );
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "The image could not be uploaded.");
    } finally {
      setUploadingId(null);
    }
  };

  if (products.loading || categories.loading) return <AdminLoadingBlock label="Loading catalog" />;

  const productError = products.error || categories.error;
  if (productError) return <AdminErrorBlock message={productError} onRetry={() => { products.reload(); categories.reload(); }} />;

  return (
    <div className="space-y-6">
      <AdminPanel
        title="Catalog controls"
        description="Products are read from the admin catalog endpoint. Create, update and soft-delete actions use the documented admin routes."
        action={
          <button type="button" onClick={openCreate} className={buttonPrimaryClass}>
            New product
          </button>
        }
      >
        <p className={noteClass}>
          Upload JPG, PNG or WEBP images up to 5MB from the edit form. Uploaded images are shown read-only from the catalog
          record; image fields are not part of the product form payload.
        </p>
      </AdminPanel>

      {actionError && (
        <div role="alert" className={`${cardClass} border-burgundy/60 text-sm text-cream`}>
          {actionError}
        </div>
      )}

      {formOpen && (
        <AdminPanel
          title={editingId ? "Edit product" : "Create product"}
          description="Fields match the AdminProductIn schema. JSON fields accept arrays and objects only."
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
              <select
                value={form.category_id}
                onChange={(event) => setField("category_id", event.target.value)}
                className={`${inputClass} mt-2`}
              >
                <option value="">No category</option>
                {(categories.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Price</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setField("price", event.target.value)}
                className={`${inputClass} mt-2`}
              />
            </label>
            <label>
              <span className={labelClass}>Currency</span>
              <input
                maxLength={3}
                value={form.currency}
                onChange={(event) => setField("currency", event.target.value.toUpperCase())}
                className={`${inputClass} mt-2`}
              />
            </label>
            <label>
              <span className={labelClass}>Status</span>
              <select
                value={form.status}
                onChange={(event) => setField("status", event.target.value as ProductStatus)}
                className={`${inputClass} mt-2`}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Sort order</span>
              <input
                type="number"
                value={form.sort_order}
                onChange={(event) => setField("sort_order", event.target.value)}
                className={`${inputClass} mt-2`}
              />
            </label>
            <div className="flex flex-wrap items-end gap-6 pb-1">
              <label className="flex items-center gap-2 font-sans text-xs text-cream/80">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setField("is_active", event.target.checked)}
                  className="h-4 w-4 border border-cream/30 bg-black accent-burgundy"
                />
                Active
              </label>
              <label className="flex items-center gap-2 font-sans text-xs text-cream/80">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(event) => setField("is_featured", event.target.checked)}
                  className="h-4 w-4 border border-cream/30 bg-black accent-burgundy"
                />
                Featured
              </label>
            </div>
            <label className="md:col-span-2">
              <span className={labelClass}>Short description</span>
              <input
                maxLength={500}
                value={form.short_description}
                onChange={(event) => setField("short_description", event.target.value)}
                className={`${inputClass} mt-2`}
              />
            </label>
            <label className="md:col-span-2">
              <span className={labelClass}>Description</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                className={`${textareaClass} mt-2`}
              />
            </label>
            <label className="md:col-span-2">
              <span className={labelClass}>Features (JSON array)</span>
              <textarea
                rows={4}
                value={form.features}
                onChange={(event) => setField("features", event.target.value)}
                className={`${textareaClass} mt-2`}
              />
            </label>
            <label className="md:col-span-2">
              <span className={labelClass}>Specifications (JSON object)</span>
              <textarea
                rows={4}
                value={form.specifications}
                onChange={(event) => setField("specifications", event.target.value)}
                className={`${textareaClass} mt-2`}
              />
            </label>
            <div className="md:col-span-2 border-t border-cream/10 pt-4">
              <span className={labelClass}>Images</span>
              <div className="mt-2 border border-cream/10 bg-black px-3 py-2 font-sans text-xs text-cream/70">
                {editingProduct?.images.length ? (
                  <ul className="space-y-1">
                    {editingProduct.images.map((image) => (
                      <li key={image.id} className="flex flex-wrap items-center gap-2 break-all">
                        <a href={image.url} target="_blank" rel="noopener noreferrer" className="text-burgundy underline underline-offset-2">
                          {image.url}
                        </a>
                        {image.is_primary && <StatusBadge value="primary" />}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-cream/45">No images recorded for this product.</span>
                )}
              </div>
              {editingProduct ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label>
                    <span className={labelClass}>Upload image (JPG, PNG or WEBP, max 5MB)</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        setUploadFile(event.target.files?.[0] ?? null);
                        setUploadError("");
                      }}
                      className={`${inputClass} mt-2 file:mr-3 file:border-0 file:bg-burgundy file:px-3 file:py-1.5 file:font-sans file:text-[10px] file:uppercase file:tracking-[0.14em] file:text-cream`}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void uploadImage(editingProduct)}
                    disabled={!uploadFile || uploadingId === editingProduct.id}
                    className={buttonSecondaryClass}
                  >
                    {uploadingId === editingProduct.id ? "Uploading" : "Upload image"}
                  </button>
                </div>
              ) : (
                <p className={`${noteClass} mt-3`}>Create the product before uploading images.</p>
              )}
              {uploadError && (
                <p role="alert" className={`${noteClass} mt-3 text-burgundy`}>
                  {uploadError}
                </p>
              )}
              <p className={`${noteClass} mt-2`}>
                Uploaded images are read-only from the catalog record and cannot be edited or removed here.
              </p>
            </div>
          </div>

          {formError && (
            <div role="alert" className={`${cardClass} mt-5 border-burgundy/60 text-sm text-cream`}>
              {formError}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => void saveProduct()} disabled={saving} className={buttonPrimaryClass}>
              {saving ? "Saving" : editingId ? "Save changes" : "Create product"}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className={buttonSecondaryClass} disabled={saving}>
              Cancel
            </button>
          </div>
        </AdminPanel>
      )}

      <AdminPanel title="Products" description={`${total.toString().padStart(2, "0")} catalog records returned by the API.`}>
        <ResponsiveTable
          columns={[
            { key: "product", label: "Product" },
            { key: "category", label: "Category" },
            { key: "price", label: "Price" },
            { key: "status", label: "Status" },
            { key: "images", label: "Images" },
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
                  <p className="font-sans text-sm font-medium text-cream">{product.name}</p>
                  <p className="mt-1 font-sans text-[10px] text-cream/40">{product.slug}</p>
                  {product.is_deleted && <p className="mt-1 font-sans text-[10px] uppercase tracking-widest text-burgundy">Deleted</p>}
                </div>
              );
            }
            if (key === "category") return <span className="font-sans text-xs text-cream/70">{product.category?.name ?? "—"}</span>;
            if (key === "price") {
              return <span className="font-sans text-sm"><Money value={product.price} currency={product.currency} /></span>;
            }
            if (key === "status") {
              return (
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge value={product.status} />
                  <StatusBadge value={product.is_active ? "active" : "inactive"} />
                  {product.is_featured && <StatusBadge value="featured" />}
                </div>
              );
            }
            if (key === "images") {
              const primary = product.images.find((image) => image.is_primary) ?? product.images[0];
              return primary ? (
                <a href={primary.url} target="_blank" rel="noopener noreferrer" className="font-sans text-[11px] text-burgundy underline underline-offset-2">
                  View URL
                </a>
              ) : (
                <span className="font-sans text-xs text-cream/40">None</span>
              );
            }
            if (key === "updated") return <DateText value={product.updated_at ?? product.created_at} withTime />;
            return (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  disabled={product.is_deleted}
                  className="border border-cream/20 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-cream/70 hover:border-burgundy hover:text-burgundy disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteProduct(product)}
                  disabled={product.is_deleted || deletingId === product.id}
                  className="border border-burgundy/60 px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-burgundy hover:bg-burgundy hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deletingId === product.id ? "Deleting" : "Delete"}
                </button>
              </div>
            );
          }}
          renderCard={(product) => (
            <div className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-sm font-medium text-cream">{product.name}</p>
                  <p className="mt-1 font-sans text-[10px] text-cream/40">{product.slug}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <StatusBadge value={product.status} />
                  {product.is_deleted && <StatusBadge value="deleted" />}
                </div>
              </div>
              <div className="mt-4 grid gap-2 font-sans text-xs text-cream/65">
                <p>{product.category?.name ?? "No category"}</p>
                <p><Money value={product.price} currency={product.currency} /></p>
                <p>Updated <DateText value={product.updated_at ?? product.created_at} withTime /></p>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => openEdit(product)} disabled={product.is_deleted} className={buttonSecondaryClass}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void deleteProduct(product)}
                  disabled={product.is_deleted || deletingId === product.id}
                  className={buttonPrimaryClass}
                >
                  {deletingId === product.id ? "Deleting" : "Delete"}
                </button>
              </div>
            </div>
          )}
        />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-cream/10 pt-4">
          <p className="font-sans text-[11px] text-cream/50">
            Page {products.data?.page ?? page} of {totalPages} · {total} records
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className={buttonSecondaryClass}>
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages}
              className={buttonSecondaryClass}
            >
              Next
            </button>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="Category reference" description="Categories available for product assignment. Manage them from the Categories page.">
        <div className="flex flex-wrap gap-2">
          {(categories.data ?? []).map((category) => (
            <StatusBadge key={category.id} value={category.name} />
          ))}
          {(categories.data ?? []).length === 0 && <p className="font-sans text-xs text-cream/45">No categories returned.</p>}
        </div>
      </AdminPanel>
    </div>
  );
}
