"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Flame,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import type {
  PublicStoreSettings,
  SerializedProduct,
  SerializedReview,
} from "@/lib/storefront";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "./ProductCard";

interface ProductDetailClientProps {
  product: SerializedProduct;
  reviews: SerializedReview[];
  crossSell: SerializedProduct[];
  settings: PublicStoreSettings;
}

const BREW_RECOMMENDATIONS: Record<
  string,
  { method: string; ratio: string; temp: string; note: string }
> = {
  LIGHT: {
    method: "Pour-Over V60 / Chemex",
    ratio: "1:16 (15g coffee → 240g water)",
    temp: "94°C / 201°F",
    note: "Medium-fine grind; aim for a 2:45–3:10 total drawdown for maximum floral clarity.",
  },
  MEDIUM: {
    method: "Espresso / AeroPress",
    ratio: "1:2 Espresso (18g → 36g in 28s)",
    temp: "93°C / 199°F",
    note: "Balanced extraction that shines both neat and with steamed milk.",
  },
  DARK: {
    method: "Espresso / French Press",
    ratio: "1:15 French Press or 1:1.8 Ristretto",
    temp: "90°C / 194°F",
    note: "Slightly cooler brew water prevents bitterness and amplifies bittersweet cocoa.",
  },
};

export function ProductDetailClient({
  product,
  reviews,
  crossSell,
  settings,
}: ProductDetailClientProps) {
  const addItem = useCartStore((s) => s.addItem);

  const images =
    product.images.length > 0
      ? product.images
      : [
          "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1000&q=85",
        ];

  const [activeImage, setActiveImage] = useState(images[0]);
  const initialVariant =
    product.variants.find((v) => v.stockCount > 0) ?? product.variants[0];
  const [selectedVariantId, setSelectedVariantId] = useState(
    initialVariant?.id ?? ""
  );
  const [quantity, setQuantity] = useState(1);

  // Review form state
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewState, setReviewState] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) ??
    product.variants[0];
  const isOutOfStock = !selectedVariant || selectedVariant.stockCount <= 0;
  const maxStock = selectedVariant?.stockCount ?? 0;
  const activePrice = selectedVariant?.effectivePrice ?? product.basePrice;

  const tastingNotes = product.originNotes
    ? product.originNotes
        .split("•")
        .map((n) => n.trim())
        .filter(Boolean)
    : [];

  const brewRec = product.roastLevel
    ? BREW_RECOMMENDATIONS[product.roastLevel]
    : null;

  function handleAddToCart() {
    if (!selectedVariant || isOutOfStock) return;
    addItem(
      {
        productId: product.id,
        variantId: selectedVariant.id,
        slug: product.slug,
        name: product.name,
        variantName: selectedVariant.name,
        sku: selectedVariant.sku,
        price: selectedVariant.effectivePrice,
        image: images[0],
        maxStock: selectedVariant.stockCount,
      },
      quantity
    );
  }

  async function handleReviewSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setReviewState("submitting");
    setReviewFeedback(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          authorName,
          rating,
          comment,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setReviewState("error");
        setReviewFeedback(data.error || "Unable to submit review.");
        return;
      }

      setReviewState("success");
      setReviewFeedback(data.message);
      setAuthorName("");
      setRating(5);
      setComment("");
    } catch {
      setReviewState("error");
      setReviewFeedback("Network error. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-8 flex items-center gap-2 text-xs text-muted"
      >
        <Link href="/" className="hover:text-espresso">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-espresso">
          Shop
        </Link>
        <span>/</span>
        <Link
          href={`/shop/${product.category.slug}`}
          className="hover:text-espresso"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-espresso">{product.name}</span>
      </nav>

      {/* Main Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-[4/5] bg-linen border border-stone-border overflow-hidden">
            <img
              src={activeImage}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <button
                  key={img + idx}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square border overflow-hidden cursor-pointer ${
                    activeImage === img
                      ? "border-espresso"
                      : "border-stone-border opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Controls */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/shop/${product.category.slug}`}
              className="text-xs uppercase tracking-[0.2em] text-terracotta font-medium"
            >
              {product.category.name}
            </Link>
            {product.roastLevel && (
              <span className="text-xs uppercase tracking-[0.16em] text-muted border-l border-stone-border pl-3">
                {product.roastLevel} Roast
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-espresso leading-tight">
            {product.name}
          </h1>

          {/* Rating Summary */}
          {product.reviewCount > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(product.averageRating)
                        ? "fill-terracotta text-terracotta"
                        : "text-stone-border"
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium text-espresso">
                {product.averageRating}
              </span>
              <a
                href="#reviews"
                className="text-muted hover:text-espresso underline underline-offset-4 text-xs"
              >
                ({product.reviewCount}{" "}
                {product.reviewCount === 1 ? "review" : "reviews"})
              </a>
            </div>
          )}

          {/* Price */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-semibold text-espresso">
              {formatCurrency(activePrice, settings.currencyCode)}
            </span>
            {product.comparePrice && product.comparePrice > activePrice && (
              <span className="text-base text-muted line-through">
                {formatCurrency(product.comparePrice, settings.currencyCode)}
              </span>
            )}
          </div>

          {/* Tasting Notes */}
          {tastingNotes.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {tastingNotes.map((note) => (
                <span
                  key={note}
                  className="bg-linen border border-stone-border px-3 py-1 text-xs tracking-wide text-roast"
                >
                  {note}
                </span>
              ))}
            </div>
          )}

          <p className="mt-6 text-sm sm:text-base text-muted leading-relaxed">
            {product.description}
          </p>

          {/* Interactive Variant Selector */}
          <div className="mt-8 pt-6 border-t border-stone-border">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="uppercase tracking-[0.16em] font-semibold text-espresso">
                Weight &amp; Grind Option
              </span>
              <span
                className={
                  isOutOfStock
                    ? "text-rust font-semibold uppercase tracking-wider"
                    : maxStock <= 10
                    ? "text-terracotta font-medium"
                    : "text-muted"
                }
              >
                {isOutOfStock
                  ? "Out of Stock"
                  : maxStock <= 10
                  ? `Only ${maxStock} left in batch`
                  : `In Stock (${maxStock} available)`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                    className={`flex items-center justify-between px-4 py-3 text-left border transition-colors cursor-pointer ${
                      active
                        ? "border-espresso bg-espresso text-alabaster"
                        : "border-stone-border bg-surface text-roast hover:border-espresso"
                    } ${oos ? "opacity-55" : ""}`}
                  >
                    <span className={`text-xs font-medium ${oos ? "line-through" : ""}`}>
                      {variant.name}
                    </span>
                    <span
                      className={`text-xs ${
                        active ? "text-alabaster/80" : "text-muted"
                      }`}
                    >
                      {oos
                        ? "Sold Out"
                        : formatCurrency(
                            variant.effectivePrice,
                            settings.currencyCode
                          )}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedVariant && (
              <p className="mt-2.5 text-[11px] text-muted">
                SKU: {selectedVariant.sku}
              </p>
            )}
          </div>

          {/* Quantity + Add to Bag */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="inline-flex items-center justify-between border border-stone-border bg-surface sm:w-36">
              <button
                type="button"
                disabled={isOutOfStock || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="p-3.5 text-espresso hover:bg-linen disabled:opacity-40 cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-espresso">
                {isOutOfStock ? 0 : quantity}
              </span>
              <button
                type="button"
                disabled={isOutOfStock || quantity >= maxStock}
                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                aria-label="Increase quantity"
                className="p-3.5 text-espresso hover:bg-linen disabled:opacity-40 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToCart}
              className="flex-1 inline-flex items-center justify-center gap-2.5 bg-espresso text-alabaster py-4 px-8 text-xs uppercase tracking-[0.18em] font-medium hover:bg-roast disabled:bg-stone-border disabled:text-muted disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              {isOutOfStock
                ? "Out of Stock"
                : `Add to Bag — ${formatCurrency(
                    activePrice * quantity,
                    settings.currencyCode
                  )}`}
            </button>
          </div>

          {/* Roastery Guarantees */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-stone-border text-xs text-roast">
            <div className="flex items-start gap-2.5">
              <Flame className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
              <span>
                Roasted to order every{" "}
                <strong>{settings.storyData.roastDays}</strong>
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Truck className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
              <span>
                Free delivery over{" "}
                <strong>
                  {formatCurrency(
                    settings.freeShippingThreshold,
                    settings.currencyCode
                  )}
                </strong>
              </span>
            </div>
          </div>

          {/* Brew Recommendations */}
          {brewRec && (
            <div className="mt-8 bg-linen border border-stone-border p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-xl font-medium text-espresso">
                  Barista Brew Recommendation
                </h2>
                <Link
                  href="/brew-guide"
                  className="text-xs uppercase tracking-[0.14em] text-terracotta hover:underline"
                >
                  Full Guide
                </Link>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <dt className="text-muted uppercase tracking-wider">Method</dt>
                  <dd className="font-medium text-espresso mt-0.5">
                    {brewRec.method}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted uppercase tracking-wider">Ratio</dt>
                  <dd className="font-medium text-espresso mt-0.5">
                    {brewRec.ratio}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted uppercase tracking-wider">Temp</dt>
                  <dd className="font-medium text-espresso mt-0.5">
                    {brewRec.temp}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted leading-relaxed">{brewRec.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reviews & Write a Review */}
      <section
        id="reviews"
        className="mt-20 pt-16 border-t border-stone-border grid grid-cols-1 lg:grid-cols-12 gap-12"
      >
        <div className="lg:col-span-7">
          <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta mb-2">
            Tasting Notes from Customers
          </p>
          <h2 className="font-serif text-3xl font-medium text-espresso mb-8">
            Verified Reviews ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <p className="text-sm text-muted border border-stone-border bg-surface p-8">
              No reviews yet for this lot. Be the first to share your brew notes.
            </p>
          ) : (
            <div className="space-y-5">
              {reviews.map((rev) => (
                <article
                  key={rev.id}
                  className="border border-stone-border bg-surface p-6"
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-medium text-sm text-espresso">
                        {rev.authorName}
                      </span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-terracotta">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < rev.rating
                              ? "fill-terracotta text-terracotta"
                              : "text-stone-border"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-roast leading-relaxed">
                    {rev.comment}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Write a Review Form */}
        <div className="lg:col-span-5">
          <div className="border border-stone-border bg-surface p-6 sm:p-8">
            <h3 className="font-serif text-2xl font-medium text-espresso mb-2">
              Write a Review
            </h3>
            <p className="text-xs text-muted mb-6">
              Share your extraction method and tasting impressions. Reviews are
              published after quick moderation.
            </p>

            {reviewState === "success" ? (
              <div className="flex items-start gap-3 border border-terracotta/30 bg-linen p-4 text-sm text-espresso">
                <CheckCircle2 className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
                <span>{reviewFeedback}</span>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="review-author"
                    className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
                  >
                    Your Name
                  </label>
                  <input
                    id="review-author"
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Julian K."
                    className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5">
                    Rating
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`Rate ${star} out of 5`}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= rating
                              ? "fill-terracotta text-terracotta"
                              : "text-stone-border"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="review-comment"
                    className="block text-xs uppercase tracking-[0.14em] text-roast mb-1.5"
                  >
                    Tasting Notes
                  </label>
                  <textarea
                    id="review-comment"
                    rows={4}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="How did you brew it, and what stood out in the cup?"
                    className="w-full border border-stone-border bg-alabaster px-3.5 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none"
                  />
                </div>

                {reviewState === "error" && reviewFeedback && (
                  <p role="alert" className="text-xs text-rust">
                    {reviewFeedback}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={reviewState === "submitting"}
                  className="w-full inline-flex items-center justify-center gap-2 bg-espresso text-alabaster py-3 px-6 text-xs uppercase tracking-[0.16em] hover:bg-roast disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {reviewState === "submitting" && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Paired Cross-Sell */}
      {crossSell.length > 0 && (
        <section className="mt-20 pt-16 border-t border-stone-border">
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta mb-2">
              Complete Your Ritual
            </p>
            <h2 className="font-serif text-3xl font-medium text-espresso">
              Paired Roasts &amp; Gear
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {crossSell.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                currencyCode={settings.currencyCode}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
