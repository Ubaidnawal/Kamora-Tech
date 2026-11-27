"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { AdminEmptyBlock, AdminErrorBlock, AdminLoadingBlock, AdminPanel, ResponsiveTable, StatusBadge } from "./AdminPrimitives";
import { buttonPrimaryClass, cardClass, inputClass, labelClass, noteClass, textareaClass } from "./adminStyles";
import type { AdminCategoryPayload, Category } from "./types";
import { useAdminResource } from "./useAdminResource";

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
};

const emptyForm: CategoryForm = { name: "", slug: "", description: "", is_active: true };

export function CategoriesPanel() {
  const { data, setData, loading, error, reload } = useAdminResource<Category[]>("/api/v1/admin/categories");
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const createCategory = async () => {
    if (form.name.trim().length < 2) {
      setFormError("Name must contain at least two characters.");
      return;
    }

    const payload: AdminCategoryPayload = {
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      description: form.description.trim() || null,
      is_active: form.is_active,
    };

    setSaving(true);
    setFormError("");

    try {
      const created = await apiFetch<Category>("/api/v1/admin/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setData((current) => [created, ...(current ?? [])]);
      setForm(emptyForm);
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : "The category could not be created.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLoadingBlock label="Loading categories" />;
  if (error) return <AdminErrorBlock message={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <AdminPanel title="Add category" description="Creates a catalog category through the admin categories endpoint.">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className={labelClass}>Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className={`${inputClass} mt-2`}
            />
          </label>
          <label>
            <span className={labelClass}>Slug (optional)</span>
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              className={`${inputClass} mt-2`}
            />
          </label>
          <label className="md:col-span-2">
            <span className={labelClass}>Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className={`${textareaClass} mt-2`}
            />
          </label>
          <label className="flex items-center gap-2 font-sans text-xs text-[#000000]/80 md:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              className="h-4 w-4 border border-[#E2E2E2]/30 bg-[#FFFFFF] accent-[#B00020]"
            />
            Active
          </label>
        </div>
        {formError && (
          <div role="alert" className={`${cardClass} mt-4 border-[#B00020]/60 text-sm text-[#000000]`}>
            {formError}
          </div>
        )}
        <button type="button" onClick={() => void createCategory()} disabled={saving} className={`${buttonPrimaryClass} mt-5`}>
          {saving ? "Creating" : "Create category"}
        </button>
      </AdminPanel>

      <AdminPanel title="Categories" description={`${(data ?? []).length.toString().padStart(2, "0")} categories returned by the API.`}>
        <p className={`${noteClass} mb-4`}>The backend defines list and create routes only; edit and delete actions are not available.</p>
        <ResponsiveTable
          columns={[
            { key: "name", label: "Name" },
            { key: "slug", label: "Slug" },
            { key: "description", label: "Description" },
            { key: "status", label: "Status" },
          ]}
          rows={data ?? []}
          rowKey={(category) => category.id}
          empty={<AdminEmptyBlock title="No categories found" description="Create the first category using the form above." />}
          renderCell={(category, key) => {
            if (key === "name") return <span className="font-sans text-sm font-medium text-[#000000]">{category.name}</span>;
            if (key === "slug") return <span className="font-sans text-xs text-[#000000]/55">{category.slug}</span>;
            if (key === "description") return <span className="font-sans text-xs text-[#000000]/65">{category.description ?? "—"}</span>;
            return <StatusBadge value={category.is_active ? "active" : "inactive"} />;
          }}
          renderCard={(category) => (
            <div className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-sans text-sm font-medium text-[#000000]">{category.name}</p>
                  <p className="mt-1 font-sans text-[10px] text-[#000000]/40">{category.slug}</p>
                </div>
                <StatusBadge value={category.is_active ? "active" : "inactive"} />
              </div>
              <p className="mt-4 font-sans text-xs text-[#000000]/60">{category.description ?? "No description."}</p>
            </div>
          )}
        />
      </AdminPanel>
    </div>
  );
}
