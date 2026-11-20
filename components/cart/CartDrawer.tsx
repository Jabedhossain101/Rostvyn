"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import type { PublicStoreSettings } from "@/lib/storefront";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";

interface CartDrawerProps {
  settings: PublicStoreSettings;
}

export function CartDrawer({ settings }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeCart]);

  if (!mounted || !isOpen) return null;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const threshold = settings.freeShippingThreshold;
  const remaining = Math.max(0, threshold - subtotal);
  const progressPct =
    threshold > 0 ? Math.min(100, Math.round((subtotal / threshold) * 100)) : 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        className="fixed inset-0 bg-espresso/45 backdrop-blur-xs"
        onClick={closeCart}
      />

      <aside className="relative z-10 w-full max-w-md bg-alabaster h-full border-l border-stone-border flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-stone-border flex items-center justify-between bg-surface">
          <div>
            <h2 className="font-serif text-2xl font-medium text-espresso">
              Your Roasting Bag
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {totalItems} {totalItems === 1 ? "item" : "items"} selected
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close shopping bag"
            className="p-2 text-espresso hover:text-terracotta transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Free-Shipping Progress Bar */}
        <div className="px-6 py-4 bg-linen border-b border-stone-border">
          <div className="flex items-center gap-2 text-xs text-espresso mb-2">
            <Truck className="h-4 w-4 text-terracotta shrink-0" />
            {remaining > 0 ? (
              <span>
                Add{" "}
                <strong className="font-semibold">
                  {formatCurrency(remaining, settings.currencyCode)}
                </strong>{" "}
                more for <strong>Free Shipping</strong>
              </span>
            ) : (
              <span className="font-medium text-terracotta">
                You&apos;ve unlocked Free Tracked Shipping!
              </span>
            )}
          </div>
          <div className="h-1.5 w-full bg-stone-border overflow-hidden">
            <div
              className="h-full bg-terracotta transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="py-20 text-center">
              <ShoppingBag
                className="h-9 w-9 text-muted mx-auto mb-4"
                strokeWidth={1.5}
              />
              <p className="font-serif text-2xl text-espresso mb-2">
                Your bag is empty
              </p>
              <p className="text-sm text-muted mb-8">
                Explore our fresh small-batch single origins and signature
                blends.
              </p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="inline-flex items-center gap-2 bg-espresso text-alabaster px-6 py-3.5 text-xs uppercase tracking-[0.16em] hover:bg-roast transition-colors"
              >
                Shop Fresh Roasts
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-stone-border">
              {items.map((item) => {
                const atMax = item.quantity >= item.maxStock;
                return (
                  <li key={item.variantId} className="py-5 flex gap-4">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={closeCart}
                      className="h-24 w-20 bg-linen border border-stone-border overflow-hidden shrink-0"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${item.slug}`}
                            onClick={closeCart}
                            className="font-serif text-lg font-medium text-espresso hover:text-terracotta leading-snug line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            aria-label={`Remove ${item.name}`}
                            className="p-1 text-muted hover:text-rust transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {item.variantName}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center border border-stone-border bg-surface">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            aria-label={`Decrease quantity for ${item.name}`}
                            className="p-2 text-espresso hover:bg-linen transition-colors cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 text-xs font-medium text-espresso min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={atMax}
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            aria-label={`Increase quantity for ${item.name}`}
                            className="p-2 text-espresso hover:bg-linen disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-espresso">
                            {formatCurrency(
                              item.price * item.quantity,
                              settings.currencyCode
                            )}
                          </p>
                          {atMax && (
                            <p className="text-[10px] text-terracotta">
                              Max stock reached
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-border bg-surface px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] text-muted">
                Subtotal
              </span>
              <span className="text-lg font-semibold text-espresso">
                {formatCurrency(subtotal, settings.currencyCode)}
              </span>
            </div>
            <p className="text-xs text-muted">
              Shipping and promo codes are finalized at checkout.
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                href="/checkout"
                onClick={closeCart}
                className="w-full inline-flex items-center justify-center gap-2 bg-espresso text-alabaster py-3.5 px-6 text-xs uppercase tracking-[0.18em] font-medium hover:bg-roast transition-colors"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="w-full inline-flex items-center justify-center border border-stone-border bg-alabaster text-espresso py-3 px-6 text-xs uppercase tracking-[0.16em] hover:border-espresso transition-colors"
              >
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
