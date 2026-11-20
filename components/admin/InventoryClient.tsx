"use client";

import { useState, type FormEvent } from "react";
import { History, Loader2, SlidersHorizontal, X } from "lucide-react";

export interface InventoryVariantRow {
  id: string;
  productName: string;
  categoryName: string;
  name: string;
  sku: string;
  stockCount: number;
  isActive: boolean;
}

export interface InventoryLogRow {
  id: string;
  sku: string;
  productName: string;
  variantName: string;
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  reason: string;
  adminName: string;
  createdAt: string;
}

export function InventoryClient({
  initialVariants,
  initialLogs,
}: {
  initialVariants: InventoryVariantRow[];
  initialLogs: InventoryLogRow[];
}) {
  const [variants, setVariants] = useState(initialVariants);
  const [logs, setLogs] = useState(initialLogs);
  const [activeTab, setActiveTab] = useState<"stock" | "logs">("stock");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");

  const [adjusting, setAdjusting] = useState<InventoryVariantRow | null>(null);
  const [newStock, setNewStock] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredVariants = variants.filter((v) => {
    if (stockFilter === "low") return v.stockCount > 0 && v.stockCount <= 5;
    if (stockFilter === "out") return v.stockCount === 0;
    return true;
  });

  function openAdjust(v: InventoryVariantRow) {
    setAdjusting(v);
    setNewStock(String(v.stockCount));
    setReason("");
    setError(null);
  }

  async function handleAdjustSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!adjusting) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: adjusting.id,
          newStock: Number(newStock),
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to adjust stock.");
        setSaving(false);
        return;
      }

      // Reload fresh stock & audit log
      const fresh = await fetch("/api/admin/inventory");
      if (fresh.ok) {
        const json = await fresh.json();
        setVariants(json.variants);
        setLogs(json.logs);
      }
      setAdjusting(null);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta font-semibold">
            Roastery Stock Ledger
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-espresso">
            Inventory &amp; Audit Log
          </h1>
        </div>

        <div className="inline-flex border border-stone-border bg-surface p-1 self-start">
          <button
            type="button"
            onClick={() => setActiveTab("stock")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider cursor-pointer ${
              activeTab === "stock"
                ? "bg-espresso text-alabaster"
                : "text-roast hover:text-espresso"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Live Stock ({variants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logs")}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider cursor-pointer ${
              activeTab === "logs"
                ? "bg-espresso text-alabaster"
                : "text-roast hover:text-espresso"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            Audit Log ({logs.length})
          </button>
        </div>
      </div>

      {activeTab === "stock" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: `All Variants (${variants.length})` },
              {
                key: "low",
                label: `Low Stock ≤ 5 (${
                  variants.filter((v) => v.stockCount > 0 && v.stockCount <= 5)
                    .length
                })`,
              },
              {
                key: "out",
                label: `Out of Stock (${
                  variants.filter((v) => v.stockCount === 0).length
                })`,
              },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStockFilter(t.key as "all" | "low" | "out")}
                className={`px-4 py-2 text-xs uppercase tracking-wider border cursor-pointer ${
                  stockFilter === t.key
                    ? "border-espresso bg-espresso text-alabaster"
                    : "border-stone-border bg-surface text-roast hover:border-espresso"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="border border-stone-border bg-surface overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-border bg-linen/70 text-[11px] uppercase tracking-[0.14em] text-roast">
                  <th className="py-3.5 px-5 font-semibold">SKU</th>
                  <th className="py-3.5 px-5 font-semibold">Product &amp; Variant</th>
                  <th className="py-3.5 px-5 font-semibold">Category</th>
                  <th className="py-3.5 px-5 font-semibold">Stock Level</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-border">
                {filteredVariants.map((v) => (
                  <tr key={v.id} className="hover:bg-alabaster/70">
                    <td className="py-3.5 px-5 font-mono text-xs text-espresso">
                      {v.sku}
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-medium text-espresso">{v.productName}</p>
                      <p className="text-xs text-muted">{v.name}</p>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-roast">
                      {v.categoryName}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-block border px-2.5 py-0.5 text-xs font-semibold ${
                          v.stockCount === 0
                            ? "border-rose-300 bg-rose-100 text-rose-900"
                            : v.stockCount <= 5
                            ? "border-amber-300 bg-amber-100 text-amber-900"
                            : "border-emerald-300 bg-emerald-50 text-emerald-800"
                        }`}
                      >
                        {v.stockCount} units
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => openAdjust(v)}
                        className="border border-stone-border bg-alabaster px-3.5 py-1.5 text-xs uppercase tracking-wider text-espresso hover:border-espresso cursor-pointer"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="border border-stone-border bg-surface overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-border bg-linen/70 text-[11px] uppercase tracking-[0.14em] text-roast">
                <th className="py-3.5 px-5 font-semibold">Timestamp (UTC)</th>
                <th className="py-3.5 px-5 font-semibold">SKU / Variant</th>
                <th className="py-3.5 px-5 font-semibold">Change</th>
                <th className="py-3.5 px-5 font-semibold">Reason</th>
                <th className="py-3.5 px-5 font-semibold">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted">
                    No inventory audit entries recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-alabaster/70">
                    <td className="py-3.5 px-5 text-xs font-mono text-muted">
                      {new Date(l.createdAt).toISOString().replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-mono text-xs text-espresso">{l.sku}</p>
                      <p className="text-xs text-muted">
                        {l.productName} — {l.variantName}
                      </p>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs">
                      <span
                        className={
                          l.quantityDelta >= 0
                            ? "text-emerald-800 font-semibold"
                            : "text-rust font-semibold"
                        }
                      >
                        {l.quantityDelta >= 0 ? `+${l.quantityDelta}` : l.quantityDelta}
                      </span>{" "}
                      <span className="text-muted">
                        ({l.previousStock} → {l.newStock})
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-roast">{l.reason}</td>
                    <td className="py-3.5 px-5 text-xs text-muted">{l.adminName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjusting && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-espresso/50"
            onClick={() => setAdjusting(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-surface border border-stone-border p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl font-medium text-espresso">
                Adjust Stock
              </h2>
              <button
                type="button"
                onClick={() => setAdjusting(null)}
                className="p-1 text-muted hover:text-espresso cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm font-medium text-espresso">
              {adjusting.productName}
            </p>
            <p className="text-xs text-muted mb-5">
              {adjusting.name} ({adjusting.sku}) • Current: {adjusting.stockCount}
            </p>

            {error && (
              <p className="mb-4 text-xs text-rust border border-rust/30 bg-rust/5 p-3">
                {error}
              </p>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                  New Stock Count *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Tuesday roast batch restock"
                  className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdjusting(null)}
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
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
