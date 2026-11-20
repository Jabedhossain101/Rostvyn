"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import type { SerializedProduct } from "@/lib/storefront";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

interface QuickViewModalProps {
  product: SerializedProduct | null;
  currencyCode: string;
  onClose: () => void;
}

export function QuickViewModal({
  product,
  currencyCode,
  onClose,
}: QuickViewModalProps) {
  const addItem = useCartStore((s) => s.addItem);

  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) return;
    const firstInStock =
      product.variants.find((v) => v.stockCount > 0) ?? product.variants[0];
    setSelectedVariantId(firstInStock?.id ?? "");
    setQuantity(1);
  }, [product]);

  useEffect(() => {
    if (!product) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0];
  const isOutOfStock = !selectedVariant || selectedVariant.stockCount <= 0;
  const maxStock = selectedVariant?.stockCount ?? 0;
  const activePrice = selectedVariant?.effectivePrice ?? product.basePrice;
  const primaryImage =
    product.images[0] ||
    "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80";

  function handleAddToCart() {
    if (!product || !selectedVariant || isOutOfStock) return;
    addItem(
      {
        productId: product.id,
        variantId: selectedVariant.id,
        slug: product.slug,
        name: product.name,
        variantName: selectedVariant.name,
        sku: selectedVariant.sku,
        price: selectedVariant.effectivePrice,
        image: primaryImage,
        maxStock: selectedVariant.stockCount,
      },
      quantity
    );
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-espresso/50 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl bg-alabaster border border-stone-border shadow-2xl grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-10 h-9 w-9 flex items-center justify-center bg-alabaster/90 text-espresso hover:text-terracotta cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="aspect-square md:aspect-auto bg-linen">
          <img
            src={primaryImage}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-terracotta mb-1.5">
              {product.category.name}
              {product.roastLevel ? ` • ${product.roastLevel} ROAST` : ""}
            </p>
            <h2
              id="quick-view-title"
              className="font-serif text-2xl sm:text-3xl font-medium text-espresso leading-tight"
            >
              {product.name}
            </h2>

            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="text-xl font-semibold text-espresso">
                {formatCurrency(activePrice, currencyCode)}
              </span>
              {product.comparePrice && product.comparePrice > activePrice && (
                <span className="text-sm text-muted line-through">
                  {formatCurrency(product.comparePrice, currencyCode)}
                </span>
              )}
            </div>

            {product.originNotes && (
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-roast">
                {product.originNotes}
              </p>
            )}

            <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-3">
              {product.description}
            </p>

            {/* Variant Selector */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="uppercase tracking-[0.14em] text-roast font-medium">
                  Select Option
                </span>
                <span
                  className={
                    isOutOfStock
                      ? "text-rust font-medium"
                      : maxStock <= 10
                      ? "text-terracotta font-medium"
                      : "text-muted"
                  }
                >
                  {isOutOfStock
                    ? "Out of Stock"
                    : `${maxStock} available`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const active = variant.id === selectedVariant?.id;
                  const oos = variant.stockCount <= 0;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setQuantity(1);
                      }}
                      className={`px-3 py-2 text-xs border transition-colors cursor-pointer ${
                        active
                          ? "border-espresso bg-espresso text-alabaster"
                          : "border-stone-border bg-surface text-roast hover:border-espresso"
                      } ${oos ? "opacity-55 line-through" : ""}`}
                    >
                      {variant.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-stone-border bg-surface">
                <button
                  type="button"
                  disabled={isOutOfStock || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-3 text-espresso hover:bg-linen disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="px-4 text-sm font-medium text-espresso min-w-[2.5rem] text-center">
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock || quantity >= maxStock}
                  onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                  aria-label="Increase quantity"
                  className="p-3 text-espresso hover:bg-linen disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-espresso text-alabaster py-3.5 px-5 text-xs uppercase tracking-[0.16em] font-medium hover:bg-roast disabled:bg-stone-border disabled:text-muted disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4" />
                {isOutOfStock ? "Out of Stock" : "Add to Bag"}
              </button>
            </div>

            <Link
              href={`/product/${product.slug}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-roast hover:text-terracotta transition-colors"
            >
              View Full Tasting Profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
