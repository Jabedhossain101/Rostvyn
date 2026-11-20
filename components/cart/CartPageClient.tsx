"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import type { PublicStoreSettings, SerializedProduct } from "@/lib/storefront";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { ProductCard } from "@/components/storefront/ProductCard";

interface CartPageClientProps {
  settings: PublicStoreSettings;
  crossSell: SerializedProduct[];
}

interface AppliedPromo {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  discountAmount: number;
}

export function CartPageClient({ settings, crossSell }: CartPageClientProps) {
  const items = useCartStore((s) => s.items);
  const storedPromoCode = useCartStore((s) => s.promoCode);
  const setStoredPromoCode = useCartStore((s) => s.setPromoCode);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [mounted, setMounted] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const subtotal = mounted
    ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0;

  // Re-validate stored promo code whenever subtotal changes
  useEffect(() => {
    if (!mounted || !storedPromoCode || subtotal <= 0) {
      if (!storedPromoCode) setAppliedPromo(null);
      return;
    }

    let cancelled = false;
    async function revalidate() {
      try {
        const res = await fetch("/api/promos/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: storedPromoCode, subtotal }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.valid) {
          setAppliedPromo(data);
          setPromoError(null);
        } else {
          setAppliedPromo(null);
          setStoredPromoCode(null);
        }
      } catch {
        // Ignore transient errors on background re-check
      }
    }
    revalidate();
    return () => {
      cancelled = true;
    };
  }, [mounted, storedPromoCode, subtotal, setStoredPromoCode]);

  async function handleApplyPromo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = promoInput.trim();
    if (!code) return;

    setPromoLoading(true);
    setPromoError(null);

    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setPromoError(data.error || "Invalid promo code.");
        return;
      }

      setAppliedPromo(data);
      setStoredPromoCode(data.code);
      setPromoInput("");
    } catch {
      setPromoError("Unable to validate promo code right now.");
    } finally {
      setPromoLoading(false);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setStoredPromoCode(null);
    setPromoError(null);
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-sm text-muted">
        Loading your roasting bag...
      </div>
    );
  }

  const discountAmount = appliedPromo?.discountAmount ?? 0;
  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const threshold = settings.freeShippingThreshold;
  const remaining = Math.max(0, threshold - netSubtotal);
  const progressPct =
    threshold > 0
      ? Math.min(100, Math.round((netSubtotal / threshold) * 100))
      : 100;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      {items.length === 0 ? (
        <div className="border border-stone-border bg-surface p-12 sm:p-16 text-center max-w-2xl mx-auto">
          <ShoppingBag
            className="h-10 w-10 text-muted mx-auto mb-5"
            strokeWidth={1.5}
          />
          <h2 className="font-serif text-3xl font-medium text-espresso mb-3">
            Your Roasting Bag is Empty
          </h2>
          <p className="text-sm text-muted mb-8 max-w-md mx-auto leading-relaxed">
            Discover our single-origin micro-lots, signature espresso blends,
            and curated tasting flights roasted to order every{" "}
            {settings.storyData.roastDays}.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2.5 bg-espresso text-alabaster px-8 py-4 text-xs uppercase tracking-[0.18em] font-medium hover:bg-roast transition-colors"
          >
            Explore Fresh Roasts
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: Cart Items & Free Shipping Progress */}
          <div className="lg:col-span-8 space-y-6">
            {/* Free Shipping Progress */}
            <div className="border border-stone-border bg-linen p-5">
              <div className="flex items-center gap-2.5 text-sm text-espresso mb-2.5">
                <Truck className="h-4 w-4 text-terracotta shrink-0" />
                {remaining > 0 ? (
                  <span>
                    Add{" "}
                    <strong className="font-semibold">
                      {formatCurrency(remaining, settings.currencyCode)}
                    </strong>{" "}
                    more to unlock <strong>Complimentary Tracked Delivery</strong>
                  </span>
                ) : (
                  <span className="font-medium text-terracotta">
                    You&apos;ve unlocked Complimentary Tracked Delivery!
                  </span>
                )}
              </div>
              <div className="h-2 w-full bg-stone-border overflow-hidden">
                <div
                  className="h-full bg-terracotta transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-stone-border bg-surface divide-y divide-stone-border">
              {items.map((item) => {
                const atMax = item.quantity >= item.maxStock;
                return (
                  <div
                    key={item.variantId}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5"
                  >
                    <Link
                      href={`/product/${item.slug}`}
                      className="h-28 w-24 bg-linen border border-stone-border overflow-hidden shrink-0"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/product/${item.slug}`}
                            className="font-serif text-xl font-medium text-espresso hover:text-terracotta transition-colors"
                          >
                            {item.name}
                          </Link>
                          <p className="text-xs uppercase tracking-[0.12em] text-muted mt-1">
                            {item.variantName} • SKU {item.sku}
                          </p>
                          <p className="text-xs text-roast mt-1">
                            {formatCurrency(item.price, settings.currencyCode)}{" "}
                            each
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          aria-label={`Remove ${item.name}`}
                          className="p-1.5 text-muted hover:text-rust transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center border border-stone-border bg-alabaster">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.variantId, item.quantity - 1)
                              }
                              aria-label={`Decrease quantity for ${item.name}`}
                              className="p-2.5 text-espresso hover:bg-linen transition-colors cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="px-4 text-sm font-medium text-espresso min-w-[2.5rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={atMax}
                              onClick={() =>
                                updateQuantity(item.variantId, item.quantity + 1)
                              }
                              aria-label={`Increase quantity for ${item.name}`}
                              className="p-2.5 text-espresso hover:bg-linen disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {atMax && (
                            <span className="text-xs text-terracotta">
                              Max available ({item.maxStock})
                            </span>
                          )}
                        </div>

                        <p className="text-base font-semibold text-espresso">
                          {formatCurrency(
                            item.price * item.quantity,
                            settings.currencyCode
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Order Summary & Promo Code Preview */}
          <aside className="lg:col-span-4 border border-stone-border bg-surface p-6 sm:p-8 space-y-6 lg:sticky lg:top-28">
            <h2 className="font-serif text-2xl font-medium text-espresso">
              Order Summary
            </h2>

            {/* Promo Code Preview */}
            <div className="pb-5 border-b border-stone-border">
              <label
                htmlFor="cart-promo"
                className="block text-xs uppercase tracking-[0.14em] text-roast mb-2"
              >
                Promo Code
              </label>

              {appliedPromo ? (
                <div className="flex items-center justify-between gap-2 border border-terracotta/40 bg-linen px-3.5 py-2.5 text-xs">
                  <div className="flex items-center gap-2 text-espresso">
                    <CheckCircle2 className="h-4 w-4 text-terracotta shrink-0" />
                    <span>
                      <strong>{appliedPromo.code}</strong> applied (
                      {appliedPromo.discountType === "PERCENTAGE"
                        ? `${appliedPromo.discountValue}% off`
                        : formatCurrency(
                            appliedPromo.discountValue,
                            settings.currencyCode
                          )}
                      )
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    aria-label="Remove promo code"
                    className="text-muted hover:text-rust cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="h-3.5 w-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="cart-promo"
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="WELCOME10"
                      className="w-full border border-stone-border bg-alabaster pl-9 pr-3 py-2.5 text-xs uppercase tracking-wider text-espresso focus:border-terracotta focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={promoLoading || !promoInput.trim()}
                    className="bg-espresso text-alabaster px-4 py-2.5 text-xs uppercase tracking-[0.14em] hover:bg-roast disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {promoLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </form>
              )}

              {promoError && (
                <p role="alert" className="mt-2 text-xs text-rust">
                  {promoError}
                </p>
              )}
            </div>

            {/* Totals */}
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-medium text-espresso">
                  {formatCurrency(subtotal, settings.currencyCode)}
                </dd>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-terracotta">
                  <dt>Promo Discount ({appliedPromo?.code})</dt>
                  <dd className="font-medium">
                    -{formatCurrency(discountAmount, settings.currencyCode)}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-muted">Estimated Delivery</dt>
                <dd className="text-xs text-roast">
                  {remaining === 0
                    ? "FREE"
                    : `From ${formatCurrency(
                        settings.metroDeliveryFee,
                        settings.currencyCode
                      )}`}
                </dd>
              </div>
              <div className="pt-3 border-t border-stone-border flex items-center justify-between text-base font-semibold text-espresso">
                <dt>Estimated Total</dt>
                <dd>{formatCurrency(netSubtotal, settings.currencyCode)}</dd>
              </div>
            </dl>

            <Link
              href="/checkout"
              className="w-full inline-flex items-center justify-center gap-2.5 bg-espresso text-alabaster py-4 px-6 text-xs uppercase tracking-[0.18em] font-medium hover:bg-roast transition-colors"
            >
              Proceed to Guest Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/shop"
              className="block text-center text-xs uppercase tracking-[0.14em] text-muted hover:text-espresso transition-colors"
            >
              Continue Shopping
            </Link>
          </aside>
        </div>
      )}

      {/* Cross-Sell / Pair With Your Roast */}
      {crossSell.length > 0 && (
        <section className="mt-20 pt-16 border-t border-stone-border">
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta mb-2">
              Curated Pairings
            </p>
            <h2 className="font-serif text-3xl font-medium text-espresso">
              Pair With Your Roast
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {crossSell.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currencyCode={settings.currencyCode}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
