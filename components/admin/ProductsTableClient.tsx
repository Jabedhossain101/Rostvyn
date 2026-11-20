"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit3, Plus, Search, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  categoryName: string;
  roastLevel: string | null;
  basePrice: number;
  isActive: boolean;
  isFeatured: boolean;
  variantCount: number;
  totalStock: number;
  image: string | null;
}

export function ProductsTableClient({
  initialProducts,
  currencyCode,
}: {
  initialProducts: AdminProductRow[];
  currencyCode: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all"
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    const matchesSearch =
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "inactive" && !p.isActive);
    return matchesSearch && matchesStatus;
  });

  async function toggleField(
    id: string,
    field: "isActive" | "isFeatured",
    nextVal: boolean
  ) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: nextVal }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, [field]: nextVal } : p))
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta font-semibold">
            Catalog Management
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-espresso">
            Products ({products.length})
          </h1>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-espresso text-alabaster px-5 py-3 text-xs uppercase tracking-[0.16em] font-medium hover:bg-roast transition-colors self-start"
        >
          <Plus className="h-4 w-4" />
          New Product
        </Link>
      </div>

      {/* Search & Status Filter */}
      <div className="border border-stone-border bg-surface p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by product name, slug, or category..."
            className="w-full border border-stone-border bg-alabaster pl-9 pr-3 py-2 text-sm text-espresso focus:border-terracotta focus:outline-none"
          />
        </div>

        <div className="inline-flex border border-stone-border bg-alabaster p-0.5 self-start">
          {(["all", "active", "inactive"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 text-xs uppercase tracking-wider cursor-pointer ${
                statusFilter === tab
                  ? "bg-espresso text-alabaster"
                  : "text-roast hover:text-espresso"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-stone-border bg-surface overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-border bg-linen/70 text-[11px] uppercase tracking-[0.14em] text-roast">
              <th className="py-3.5 px-5 font-semibold">Product</th>
              <th className="py-3.5 px-5 font-semibold">Category</th>
              <th className="py-3.5 px-5 font-semibold">Base Price</th>
              <th className="py-3.5 px-5 font-semibold">Stock / Variants</th>
              <th className="py-3.5 px-5 font-semibold">Featured</th>
              <th className="py-3.5 px-5 font-semibold">Status</th>
              <th className="py-3.5 px-5 font-semibold text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-border">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-alabaster/70">
                <td className="py-3.5 px-5">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="h-11 w-9 object-cover bg-linen border border-stone-border shrink-0"
                      />
                    ) : (
                      <div className="h-11 w-9 bg-linen border border-stone-border shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-espresso">{p.name}</p>
                      <p className="text-xs text-muted font-mono">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-5 text-roast">
                  <p>{p.categoryName}</p>
                  {p.roastLevel && (
                    <p className="text-[11px] text-muted">{p.roastLevel}</p>
                  )}
                </td>
                <td className="py-3.5 px-5 font-semibold text-espresso">
                  {formatCurrency(p.basePrice, currencyCode)}
                </td>
                <td className="py-3.5 px-5 text-xs">
                  <span
                    className={`font-semibold ${
                      p.totalStock === 0
                        ? "text-rust"
                        : p.totalStock <= 5
                        ? "text-terracotta"
                        : "text-espresso"
                    }`}
                  >
                    {p.totalStock} units
                  </span>
                  <span className="text-muted"> ({p.variantCount} SKUs)</span>
                </td>
                <td className="py-3.5 px-5">
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => toggleField(p.id, "isFeatured", !p.isFeatured)}
                    aria-label={`Toggle featured for ${p.name}`}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs border cursor-pointer ${
                      p.isFeatured
                        ? "border-terracotta bg-terracotta/10 text-terracotta"
                        : "border-stone-border text-muted hover:text-espresso"
                    }`}
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        p.isFeatured ? "fill-terracotta" : ""
                      }`}
                    />
                    {p.isFeatured ? "Featured" : "Standard"}
                  </button>
                </td>
                <td className="py-3.5 px-5">
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => toggleField(p.id, "isActive", !p.isActive)}
                    className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold border cursor-pointer ${
                      p.isActive
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-stone-border bg-linen text-muted"
                    }`}
                  >
                    {p.isActive ? "Active" : "Archived"}
                  </button>
                </td>
                <td className="py-3.5 px-5 text-right">
                  <Link
                    href={`/admin/products/${p.id}/edit`}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-espresso hover:text-terracotta font-medium"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
