"use client";

import { useState, type FormEvent } from "react";
import { Edit3, Loader2, Plus, X } from "lucide-react";

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export function CategoriesClient({
  initialCategories,
}: {
  initialCategories: AdminCategoryRow[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setImageUrl("");
    setSortOrder(String(categories.length + 1));
    setIsActive(true);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(cat: AdminCategoryRow) {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setImageUrl(cat.imageUrl ?? "");
    setSortOrder(String(cat.sortOrder));
    setIsActive(cat.isActive);
    setError(null);
    setModalOpen(true);
  }

  async function refreshList() {
    const res = await fetch("/api/admin/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editing
        ? `/api/admin/categories/${editing.id}`
        : "/api/admin/categories";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          imageUrl: imageUrl.trim() || null,
          sortOrder: Number(sortOrder || 0),
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save category.");
        setSaving(false);
        return;
      }

      await refreshList();
      setModalOpen(false);
    } catch {
      setError("Network error while saving category.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cat: AdminCategoryRow) {
    const res = await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === cat.id ? { ...c, isActive: !cat.isActive } : c
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta font-semibold">
            Catalog Structure
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-espresso">
            Categories ({categories.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-espresso text-alabaster px-5 py-3 text-xs uppercase tracking-[0.16em] hover:bg-roast cursor-pointer self-start"
        >
          <Plus className="h-4 w-4" />
          New Category
        </button>
      </div>

      <div className="border border-stone-border bg-surface overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-border bg-linen/70 text-[11px] uppercase tracking-[0.14em] text-roast">
              <th className="py-3.5 px-5 font-semibold">Order</th>
              <th className="py-3.5 px-5 font-semibold">Category</th>
              <th className="py-3.5 px-5 font-semibold">Slug</th>
              <th className="py-3.5 px-5 font-semibold">Products</th>
              <th className="py-3.5 px-5 font-semibold">Status</th>
              <th className="py-3.5 px-5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-border">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-alabaster/70">
                <td className="py-3.5 px-5 font-mono text-xs text-muted">
                  #{cat.sortOrder}
                </td>
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="h-10 w-10 object-cover bg-linen border border-stone-border"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-linen border border-stone-border" />
                    )}
                    <span className="font-medium text-espresso">{cat.name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5 font-mono text-xs text-muted">
                  {cat.slug}
                </td>
                <td className="py-3.5 px-5 text-roast">{cat.productCount}</td>
                <td className="py-3.5 px-5">
                  <button
                    type="button"
                    onClick={() => toggleActive(cat)}
                    className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold border cursor-pointer ${
                      cat.isActive
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-stone-border bg-linen text-muted"
                    }`}
                  >
                    {cat.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="py-3.5 px-5 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(cat)}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-espresso hover:text-terracotta font-medium cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-espresso/50"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg bg-surface border border-stone-border p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-2xl font-medium text-espresso">
                {editing ? "Edit Category" : "Create Category"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-muted hover:text-espresso cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p className="mb-4 text-xs text-rust border border-rust/30 bg-rust/5 p-3">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editing) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, "")
                      );
                    }
                  }}
                  className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                  Thumbnail URL (Optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-xs font-mono"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-espresso cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-terracotta"
                />
                Active on Storefront
              </label>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-stone-border px-4 py-2 text-xs uppercase tracking-wider text-roast cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-espresso text-alabaster px-5 py-2 text-xs uppercase tracking-wider hover:bg-roast disabled:opacity-60 cursor-pointer"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
