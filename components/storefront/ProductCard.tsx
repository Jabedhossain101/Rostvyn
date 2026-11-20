"use client";

import Link from "next/link";
import { Eye, Plus, Star } from "lucide-react";
import type { SerializedProduct } from "@/lib/storefront";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

interface ProductCardProps {
  product: SerializedProduct;
  currencyCode: string;
  onQuickView?: (product: SerializedProduct) => void;
}

const ROAST_LABELS: Record<string, string> = {
  LIGHT: "Light Roast",
  MEDIUM: "Medium Roast",
  DARK: "Dark Roast",
};

export function ProductCard({
  product,
  currencyCode,
  onQuickView,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const defaultVariant =
    product.variants.find((v) => v.stockCount > 0) ?? product.variants[0];
  const isOutOfStock = !product.inStock || !defaultVariant || defaultVariant.stockCount <= 0;

  const savingsAmount =
    product.comparePrice && product.comparePrice > product.basePrice
      ? product.comparePrice - product.basePrice
      : 0;
  const savingsPercent =
    savingsAmount > 0 && product.comparePrice
      ? Math.round((savingsAmount / product.comparePrice) * 100)
      : 0;

  const tastingNotes = product.originNotes
    ? product.originNotes
        .split("•")
        .map((n) => n.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  const primaryImage =
    product.images[0] ||
    "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80";

  function handleQuickAdd() {
    if (isOutOfStock || !defaultVariant) return;
    addItem({
      productId: product.id,
      variantId: defaultVariant.id,
      slug: product.slug,
      name: product.name,
      variantName: defaultVariant.name,
      sku: defaultVariant.sku,
      price: defaultVariant.effectivePrice,
      image: primaryImage,
      maxStock: defaultVariant.stockCount,
    });
  }

  return (
    <article className="group flex flex-col bg-surface border border-stone-border hover:border-espresso/30 transition-colors">
      {/* Image Frame */}
      <div className="relative aspect-[4/5] overflow-hidden bg-linen">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          <img
            src={primaryImage}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.roastLevel && (
            <span className="bg-alabaster/95 backdrop-blur-xs text-espresso px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] font-medium">
              {ROAST_LABELS[product.roastLevel]}
            </span>
          )}
          {savingsPercent > 0 && (
            <span className="bg-terracotta text-alabaster px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-medium">
              Save {savingsPercent}%
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-espresso text-alabaster px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] font-medium">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick View Trigger */}
        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            aria-label={`Quick view ${product.name}`}
            className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center bg-alabaster/90 text-espresso hover:bg-espresso hover:text-alabaster transition-colors opacity-95 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <Link
              href={`/shop/${product.category.slug}`}
              className="text-[11px] uppercase tracking-[0.16em] text-muted hover:text-terracotta transition-colors"
            >
              {product.category.name}
            </Link>
            {product.reviewCount > 0 && (
              <div
                className="inline-flex items-center gap-1 text-xs text-roast"
                aria-label={`Rated ${product.averageRating} out of 5`}
              >
                <Star className="h-3.5 w-3.5 fill-terracotta text-terracotta" />
                <span className="font-medium">{product.averageRating}</span>
              </div>
            )}
          </div>

          <Link href={`/product/${product.slug}`}>
            <h3 className="font-serif text-xl font-medium text-espresso group-hover:text-terracotta transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          {tastingNotes.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {tastingNotes.map((note) => (
                <span
                  key={note}
                  className="bg-linen text-roast px-2 py-0.5 text-[11px] tracking-wide"
                >
                  {note}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-stone-border flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-espresso">
              {formatCurrency(product.basePrice, currencyCode)}
            </span>
            {product.comparePrice && product.comparePrice > product.basePrice && (
              <span className="text-xs text-muted line-through">
                {formatCurrency(product.comparePrice, currencyCode)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="inline-flex items-center gap-1.5 bg-espresso text-alabaster px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] hover:bg-roast disabled:bg-stone-border disabled:text-muted disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isOutOfStock ? (
              "Out of Stock"
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Quick Add
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
