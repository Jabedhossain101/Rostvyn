import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Award,
  Coffee,
  CreditCard,
  Flame,
  Gift,
  ShieldCheck,
  Sprout,
  Star,
  Truck,
} from "lucide-react";
import {
  getActiveCategories,
  getFeaturedReviews,
  getPublicSettings,
  queryProducts,
} from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/ProductCard";
import { RoastProfileExplorer } from "@/components/storefront/RoastProfileExplorer";
import { NewsletterBand } from "@/components/storefront/NewsletterBand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rostvyn — Specialty Coffee & Artisan Roastery",
  description:
    "Small-batch specialty coffee roasted to order every Tuesday & Friday. Shop traceable single-origin micro-lots, signature espresso blends, and tasting bundles.",
};

const BREW_PREVIEW_CARDS = [
  {
    title: "Pour-Over V60",
    grind: "Medium-Fine Grind",
    ratio: "1:16 Ratio • 94°C",
    description:
      "Unlocks jasmine, citrus, and stone-fruit clarity in washed single origins.",
    href: "/brew-guide#v60",
  },
  {
    title: "Modern Espresso",
    grind: "Fine Espresso Grind",
    ratio: "1:2 Ratio • 28–30s",
    description:
      "Syrupy sweetness and velvety crema crafted for neat shots and flat whites.",
    href: "/brew-guide#espresso",
  },
  {
    title: "Slow Cold Brew",
    grind: "Coarse / Immersion",
    ratio: "1:8 Concentrate • 16h",
    description:
      "Low-acid, dark-chocolate smoothness steeped cold for effortless refreshment.",
    href: "/brew-guide#french-press",
  },
];

export default async function HomePage() {
  const [settings, categories, featuredResult, bundlesResult, reviewData] =
    await Promise.all([
      getPublicSettings(),
      getActiveCategories(),
      queryProducts({ featured: true, sort: "featured", limit: 4 }),
      queryProducts({ category: "bundles", sort: "featured", limit: 3 }),
      getFeaturedReviews(),
    ]);

  return (
    <>
      {/* SECTION 2: Editorial Hero Banner (Section 1 is Announcement Bar + Sticky Header in layout) */}
      <section className="relative overflow-hidden bg-espresso text-alabaster">
        <div className="absolute inset-0">
          <img
            src={settings.heroData.imageUrl}
            alt="Rostvyn artisan specialty coffee pouring"
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/80 to-espresso/30" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.26em] text-terracotta font-medium mb-5">
              {settings.heroData.eyebrow}
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[64px] font-medium text-alabaster leading-[1.06] tracking-tight mb-6">
              {settings.heroData.headline}
            </h1>
            <p className="text-base sm:text-lg text-alabaster/80 leading-relaxed mb-10 max-w-xl">
              {settings.heroData.subheadline}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={settings.heroData.ctaHref || "/shop"}
                className="inline-flex items-center gap-2.5 bg-alabaster text-espresso px-7 py-4 text-xs uppercase tracking-[0.18em] font-semibold hover:bg-linen transition-colors"
              >
                {settings.heroData.ctaLabel || "Shop Fresh Roasts"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/bundles"
                className="inline-flex items-center gap-2.5 border border-alabaster/40 text-alabaster px-7 py-4 text-xs uppercase tracking-[0.18em] font-medium hover:bg-alabaster/10 transition-colors"
              >
                Explore Tasting Bundles
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Roastery Trust & Value Strip */}
      <section className="border-b border-stone-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                icon: Flame,
                title: "Small-Batch Roasted to Order",
                desc: `Profiled every ${settings.storyData.roastDays} for peak aroma`,
              },
              {
                icon: Sprout,
                title: "100% Direct-Trade Traceable",
                desc: "Ethical farm-gate lots from high-altitude growers",
              },
              {
                icon: Truck,
                title: "Fast Tracked Dispatch",
                desc: "Metro & National delivery with roast-date seal",
              },
              {
                icon: CreditCard,
                title: "Easy COD / Verified Transfer",
                desc: "Cash on Delivery, IBAN/Wire & PayID with TrxID",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3.5">
                  <div className="h-10 w-10 shrink-0 flex items-center justify-center bg-linen border border-stone-border text-terracotta">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="font-sans text-xs uppercase tracking-[0.12em] font-semibold text-espresso">
                      {item.title}
                    </h2>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: Shop by Category */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2">
                Curated Collections
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-espresso">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-roast hover:text-terracotta transition-colors"
            >
              View Entire Catalog
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop/${cat.slug}`}
                className="group relative aspect-[3/4] overflow-hidden bg-espresso border border-stone-border flex items-end p-6"
              >
                {cat.imageUrl && (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-75 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-85"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/90 via-espresso/30 to-transparent" />
                <div className="relative z-10 w-full">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-alabaster/75 mb-1">
                    {cat.productCount}{" "}
                    {cat.productCount === 1 ? "Release" : "Releases"}
                  </p>
                  <h3 className="font-serif text-2xl font-medium text-alabaster flex items-center justify-between gap-2">
                    <span>{cat.name}</span>
                    <ArrowRight className="h-4 w-4 text-terracotta transition-transform group-hover:translate-x-1" />
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: Featured Roasts / Best Sellers */}
      <section className="pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2">
                Roaster&apos;s Selection
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-espresso">
                Featured Roasts &amp; Best Sellers
              </h2>
            </div>
            <Link
              href="/shop?sort=featured"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-roast hover:text-terracotta transition-colors"
            >
              Shop All Featured
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredResult.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currencyCode={settings.currencyCode}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: Interactive Shop by Roast Profile Explorer */}
      <RoastProfileExplorer />

      {/* SECTION 7: Curated Tasting Bundles & Gift Sets */}
      {bundlesResult.products.length > 0 && (
        <section className="py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2">
                  <Gift className="h-3.5 w-3.5" />
                  Built-In Bundle Savings
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-espresso">
                  Curated Tasting Bundles &amp; Gift Sets
                </h2>
              </div>
              <Link
                href="/bundles"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-roast hover:text-terracotta transition-colors"
              >
                Explore All Bundles
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundlesResult.products.map((bundle) => (
                <ProductCard
                  key={bundle.id}
                  product={bundle}
                  currencyCode={settings.currencyCode}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SECTION 8: Roastery Origin & Craft Story Split */}
      <section className="bg-espresso text-alabaster">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2">
          <div className="relative min-h-[360px] lg:min-h-[520px]">
            <img
              src="https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=1200&q=85"
              alt="Small-batch drum roasting at Rostvyn"
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="px-6 sm:px-12 lg:px-16 py-16 lg:py-24 flex flex-col justify-center">
            <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-3">
              Roastery Philosophy
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-alabaster leading-tight mb-6">
              {settings.storyData.title}
            </h2>
            <p className="text-sm sm:text-base text-alabaster/75 leading-relaxed mb-8 max-w-xl">
              {settings.storyData.body}
            </p>
            <div className="grid grid-cols-2 gap-6 py-6 border-y border-alabaster/15 mb-8 max-w-md">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-alabaster/55">
                  Roast Schedule
                </p>
                <p className="font-serif text-xl text-alabaster mt-1">
                  {settings.storyData.roastDays}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-alabaster/55">
                  Cupping Standard
                </p>
                <p className="font-serif text-xl text-alabaster mt-1">
                  87+ SCA Score
                </p>
              </div>
            </div>
            <div>
              <Link
                href="/our-story"
                className="inline-flex items-center gap-2.5 border border-alabaster/40 px-7 py-3.5 text-xs uppercase tracking-[0.18em] text-alabaster hover:bg-alabaster hover:text-espresso transition-colors"
              >
                Read Our Story
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: Brew Like a Barista Preview */}
      <section className="py-20 lg:py-24 bg-alabaster">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2">
                Extraction Craft
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-espresso">
                Brew Like a Barista
              </h2>
            </div>
            <Link
              href="/brew-guide"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-roast hover:text-terracotta transition-colors"
            >
              Open Complete Brew Guide
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BREW_PREVIEW_CARDS.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group border border-stone-border bg-surface p-8 hover:border-espresso/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <Coffee
                      className="h-5 w-5 text-terracotta"
                      strokeWidth={1.75}
                    />
                    <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
                      {card.ratio}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-espresso group-hover:text-terracotta transition-colors mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs uppercase tracking-[0.14em] text-terracotta mb-3">
                    {card.grind}
                  </p>
                  <p className="text-sm text-muted leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <span className="mt-6 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-espresso font-medium">
                  View Recipe
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 10: Verified Customer Reviews */}
      <section className="py-20 lg:py-24 bg-surface border-t border-stone-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2">
                Community Cupping Notes
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-espresso">
                Verified Customer Reviews
              </h2>
            </div>

            <div className="inline-flex items-center gap-3 border border-stone-border bg-alabaster px-5 py-3 self-start">
              <Award className="h-5 w-5 text-terracotta" />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-base text-espresso">
                    {reviewData.aggregateRating.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-0.5 ml-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-terracotta text-terracotta"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-muted">
                  Based on {reviewData.totalApprovedCount} approved reviews
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviewData.reviews.map((rev) => (
              <article
                key={rev.id}
                className="border border-stone-border bg-alabaster p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-0.5 mb-4">
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
                  <p className="font-serif text-xl text-espresso leading-relaxed mb-6">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-border flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-espresso">
                      {rev.authorName}
                    </p>
                    {rev.productName && rev.productSlug && (
                      <Link
                        href={`/product/${rev.productSlug}`}
                        className="text-xs text-muted hover:text-terracotta transition-colors"
                      >
                        {rev.productName}
                      </Link>
                    )}
                  </div>
                  {rev.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-terracotta shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 11: First-Order Club Newsletter Band (Store Footer follows in layout) */}
      <NewsletterBand source="homepage_footer" />
    </>
  );
}
