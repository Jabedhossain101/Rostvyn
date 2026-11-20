"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";

interface VariantDraft {
  id?: string;
  name: string;
  sku: string;
  priceOverride: string;
  stockCount: string;
  isActive: boolean;
}

export interface ProductEditorInitial {
  id?: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  roastLevel: string;
  originNotes: string;
  basePrice: string;
  comparePrice: string;
  imagesText: string;
  isActive: boolean;
  isFeatured: boolean;
  variants: VariantDraft[];
}

export function ProductFormClient({
  mode,
  categories,
  initial,
}: {
  mode: "create" | "edit";
  categories: { id: string; name: string }[];
  initial?: ProductEditorInitial;
}) {
  const router = useRouter();

  const [categoryId, setCategoryId] = useState(
    initial?.categoryId ?? categories[0]?.id ?? ""
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [roastLevel, setRoastLevel] = useState(initial?.roastLevel ?? "");
  const [originNotes, setOriginNotes] = useState(initial?.originNotes ?? "");
  const [basePrice, setBasePrice] = useState(initial?.basePrice ?? "24.00");
  const [comparePrice, setComparePrice] = useState(initial?.comparePrice ?? "");
  const [imagesText, setImagesText] = useState(initial?.imagesText ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured ?? false);
  const [variants, setVariants] = useState<VariantDraft[]>(
    initial?.variants ?? [
      {
        name: "250g Whole Bean",
        sku: "",
        priceOverride: "",
        stockCount: "25",
        isActive: true,
      },
    ]
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function autoSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function updateVariant(idx: number, patch: Partial<VariantDraft>) {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, ...patch } : v))
    );
  }

  function addVariantRow() {
    setVariants((prev) => [
      ...prev,
      {
        name: "",
        sku: "",
        priceOverride: "",
        stockCount: "0",
        isActive: true,
      },
    ]);
  }

  function removeVariantRow(idx: number) {
    if (variants.length <= 1) return;
    const target = variants[idx];
    // Never hard-delete persisted variants — archive instead
    if (target.id) {
      updateVariant(idx, { isActive: false });
    } else {
      setVariants((prev) => prev.filter((_, i) => i !== idx));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const images = imagesText
      .split(/\n+/)
      .map((u) => u.trim())
      .filter(Boolean);

    const payload = {
      categoryId,
      name,
      slug,
      description,
      roastLevel: roastLevel ? roastLevel : null,
      originNotes: originNotes.trim() || null,
      basePrice: Number(basePrice),
      comparePrice: comparePrice.trim() ? Number(comparePrice) : null,
      images,
      isActive,
      isFeatured,
      variants: variants.map((v) => ({
        ...(v.id ? { id: v.id } : {}),
        name: v.name,
        sku: v.sku,
        priceOverride: v.priceOverride.trim() ? Number(v.priceOverride) : null,
        stockCount: Number(v.stockCount || 0),
        isActive: v.isActive,
      })),
    };

    try {
      const url =
        mode === "create"
          ? "/api/admin/products"
          : `/api/admin/products/${initial?.id}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save product.");
        setSaving(false);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error while saving product.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-espresso mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Products
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-espresso">
          {mode === "create" ? "Add New Product" : `Edit: ${initial?.name}`}
        </h1>
      </div>

      {error && (
        <div
          role="alert"
          className="border border-rust/40 bg-rust/5 p-4 text-sm text-rust"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Metadata */}
        <section className="border border-stone-border bg-surface p-6 space-y-4">
          <h2 className="font-serif text-2xl font-medium text-espresso">
            Product Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (mode === "create") setSlug(autoSlug(e.target.value));
                }}
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm font-mono text-espresso focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
                Roast Level
              </label>
              <select
                value={roastLevel}
                onChange={(e) => setRoastLevel(e.target.value)}
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
              >
                <option value="">None (Gear / N/A)</option>
                <option value="LIGHT">Light</option>
                <option value="MEDIUM">Medium</option>
                <option value="DARK">Dark</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
                Tasting / Origin Notes
              </label>
              <input
                type="text"
                value={originNotes}
                onChange={(e) => setOriginNotes(e.target.value)}
                placeholder="Jasmine • Bergamot • Peach"
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
                Base Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
                Compare-At Price (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
              Description *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-roast mb-1.5">
              Image URLs (one per line)
            </label>
            <textarea
              rows={2}
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-xs font-mono text-espresso focus:border-terracotta focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="inline-flex items-center gap-2 text-sm text-espresso cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-terracotta"
              />
              Active (visible on storefront)
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-espresso cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 accent-terracotta"
              />
              Featured on Homepage
            </label>
          </div>
        </section>

        {/* Variants Editor */}
        <section className="border border-stone-border bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-medium text-espresso">
                Weight &amp; Grind Variants
              </h2>
              <p className="text-xs text-muted">
                Persisted variants are safely archived via Active toggle rather
                than hard-deleted.
              </p>
            </div>
            <button
              type="button"
              onClick={addVariantRow}
              className="inline-flex items-center gap-1.5 border border-stone-border bg-alabaster px-3.5 py-2 text-xs uppercase tracking-wider text-espresso hover:border-espresso cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Variant
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div
                key={v.id ?? `new-${idx}`}
                className={`grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border border-stone-border ${
                  v.isActive ? "bg-alabaster" : "bg-linen opacity-65"
                }`}
              >
                <div className="md:col-span-4">
                  <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">
                    Variant Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={v.name}
                    onChange={(e) => updateVariant(idx, { name: e.target.value })}
                    placeholder="250g Whole Bean"
                    className="w-full border border-stone-border bg-surface px-3 py-2 text-xs text-espresso"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">
                    Unique SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={v.sku}
                    onChange={(e) => updateVariant(idx, { sku: e.target.value })}
                    placeholder="RV-LOT-250-WB"
                    className="w-full border border-stone-border bg-surface px-3 py-2 text-xs font-mono uppercase text-espresso"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">
                    Price Override
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={v.priceOverride}
                    onChange={(e) =>
                      updateVariant(idx, { priceOverride: e.target.value })
                    }
                    placeholder="Base"
                    className="w-full border border-stone-border bg-surface px-3 py-2 text-xs text-espresso"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[10px] uppercase tracking-wider text-muted mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={v.stockCount}
                    onChange={(e) =>
                      updateVariant(idx, { stockCount: e.target.value })
                    }
                    className="w-full border border-stone-border bg-surface px-2.5 py-2 text-xs text-espresso"
                  />
                </div>
                <div className="md:col-span-2 flex items-end justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs text-espresso pb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={v.isActive}
                      onChange={(e) =>
                        updateVariant(idx, { isActive: e.target.checked })
                      }
                      className="accent-terracotta"
                    />
                    Active
                  </label>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      aria-label="Remove or archive variant"
                      className="p-2 text-muted hover:text-rust cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-espresso text-alabaster px-7 py-3.5 text-xs uppercase tracking-[0.18em] font-medium hover:bg-roast disabled:opacity-60 transition-colors cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {mode === "create" ? "Create Product" : "Save Changes"}
          </button>
          <Link
            href="/admin/products"
            className="text-xs uppercase tracking-[0.14em] text-muted hover:text-espresso"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
