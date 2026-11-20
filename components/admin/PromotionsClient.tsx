"use client";

import { useState, type FormEvent } from "react";
import { Edit3, Loader2, Plus, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface AdminPromoRow {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

export function PromotionsClient({
  initialPromos,
  currencyCode,
}: {
  initialPromos: AdminPromoRow[];
  currencyCode: string;
}) {
  const [promos, setPromos] = useState(initialPromos);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPromoRow | null>(null);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">(
    "PERCENTAGE"
  );
  const [discountValue, setDiscountValue] = useState("10");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setCode("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("10");
    setMinOrderAmount("0");
    setMaxUses("");
    setExpiresAt("");
    setIsActive(true);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(p: AdminPromoRow) {
    setEditing(p);
    setCode(p.code);
    setDiscountType(p.discountType);
    setDiscountValue(String(p.discountValue));
    setMinOrderAmount(String(p.minOrderAmount));
    setMaxUses(p.maxUses !== null ? String(p.maxUses) : "");
    setExpiresAt(p.expiresAt ? p.expiresAt.slice(0, 10) : "");
    setIsActive(p.isActive);
    setError(null);
    setModalOpen(true);
  }

  async function refresh() {
    const res = await fetch("/api/admin/promotions");
    if (res.ok) {
      const data = await res.json();
      setPromos(data.promos);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editing
        ? `/api/admin/promotions/${editing.id}`
        : "/api/admin/promotions";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: Number(minOrderAmount || 0),
          maxUses: maxUses.trim() ? Number(maxUses) : null,
          expiresAt: expiresAt.trim()
            ? new Date(`${expiresAt}T23:59:59Z`).toISOString()
            : null,
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save promo code.");
        setSaving(false);
        return;
      }

      await refresh();
      setModalOpen(false);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: AdminPromoRow) {
    const res = await fetch(`/api/admin/promotions/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) {
      setPromos((prev) =>
        prev.map((row) =>
          row.id === p.id ? { ...row, isActive: !p.isActive } : row
        )
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta font-semibold">
            Growth &amp; Conversion
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-espresso">
            Promotions &amp; Coupons ({promos.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-espresso text-alabaster px-5 py-3 text-xs uppercase tracking-[0.16em] hover:bg-roast cursor-pointer self-start"
        >
          <Plus className="h-4 w-4" />
          New Promo Code
        </button>
      </div>

      <div className="border border-stone-border bg-surface overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-border bg-linen/70 text-[11px] uppercase tracking-[0.14em] text-roast">
              <th className="py-3.5 px-5 font-semibold">Code</th>
              <th className="py-3.5 px-5 font-semibold">Discount</th>
              <th className="py-3.5 px-5 font-semibold">Min Order</th>
              <th className="py-3.5 px-5 font-semibold">Redemptions</th>
              <th className="py-3.5 px-5 font-semibold">Expiry</th>
              <th className="py-3.5 px-5 font-semibold">Status</th>
              <th className="py-3.5 px-5 font-semibold text-right">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-border">
            {promos.map((p) => (
              <tr key={p.id} className="hover:bg-alabaster/70">
                <td className="py-3.5 px-5 font-mono text-sm font-semibold text-espresso">
                  {p.code}
                </td>
                <td className="py-3.5 px-5 text-terracotta font-semibold">
                  {p.discountType === "PERCENTAGE"
                    ? `${p.discountValue}% OFF`
                    : `${formatCurrency(p.discountValue, currencyCode)} OFF`}
                </td>
                <td className="py-3.5 px-5 text-roast">
                  {formatCurrency(p.minOrderAmount, currencyCode)}
                </td>
                <td className="py-3.5 px-5 font-mono text-xs text-espresso">
                  {p.usedCount} / {p.maxUses ?? "∞"}
                </td>
                <td className="py-3.5 px-5 text-xs text-muted">
                  {p.expiresAt
                    ? new Date(p.expiresAt).toLocaleDateString()
                    : "No Expiry"}
                </td>
                <td className="py-3.5 px-5">
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    className={`px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold border cursor-pointer ${
                      p.isActive
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-stone-border bg-linen text-muted"
                    }`}
                  >
                    {p.isActive ? "Active" : "Paused"}
                  </button>
                </td>
                <td className="py-3.5 px-5 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-espresso hover:text-terracotta cursor-pointer"
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
                {editing ? `Edit ${editing.code}` : "Create Promo Code"}
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
                  Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SPRING15"
                  className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")
                    }
                    className="w-full border border-stone-border bg-alabaster px-3 py-2.5 text-sm"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ({currencyCode})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                    Min Order
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={minOrderAmount}
                    onChange={(e) => setMinOrderAmount(e.target.value)}
                    className="w-full border border-stone-border bg-alabaster px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                    Max Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full border border-stone-border bg-alabaster px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-roast mb-1">
                    Expires On
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full border border-stone-border bg-alabaster px-2.5 py-2.5 text-xs"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-espresso cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-terracotta"
                />
                Active immediately
              </label>

              <div className="pt-2 flex justify-end gap-3">
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
                  Save Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
