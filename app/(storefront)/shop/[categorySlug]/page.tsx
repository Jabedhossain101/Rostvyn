import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { RoastLevel } from "@prisma/client";
import {
  getActiveCategories,
  getPublicSettings,
  queryProducts,
} from "@/lib/storefront";
import { ShopCatalogClient } from "@/components/storefront/ShopCatalogClient";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getStr(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "single-origin":
    "Traceable high-altitude micro-lots celebrating pure varietal expression, transparent washing stations, and seasonal harvests.",
  "signature-blends":
    "Harmonized house blends profiled for daily consistency, rich chocolate body, and effortless espresso or filter extraction.",
  "decaf-low-caf":
    "Naturally decaffeinated using Colombian sugarcane ethyl acetate to preserve bright sweetness and velvety cocoa depth.",
  "brewing-gear":
    "Precision ceramic drippers and tactile tools engineered for thermal stability and clean, cafe-grade extractions at home.",
  bundles:
    "Curated tasting flights and gift sets pairing our favorite seasonal roasts and brewing tools with built-in savings.",
};

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const categories = await getActiveCategories();
  const cat = categories.find((c) => c.slug === categorySlug);

  if (!cat) {
    return { title: "Collection Not Found" };
  }

  return {
    title: cat.name,
    description:
      CATEGORY_DESCRIPTIONS[cat.slug] ??
      `Shop Rostvyn's ${cat.name} specialty coffee collection.`,
  };
}

export default async function CategoryShopPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { categorySlug } = await params;
  const sp = await searchParams;

  const [settings, categories] = await Promise.all([
    getPublicSettings(),
    getActiveCategories(),
  ]);

  const currentCategory = categories.find((c) => c.slug === categorySlug);
  if (!currentCategory) {
    notFound();
  }

  const roastParam = getStr(sp.roast)?.toUpperCase();
  const validRoast =
    roastParam === "LIGHT" || roastParam === "MEDIUM" || roastParam === "DARK"
      ? (roastParam as RoastLevel)
      : undefined;

  const initialData = await queryProducts({
    q: getStr(sp.q),
    category: categorySlug,
    roast: validRoast,
    grind: getStr(sp.grind),
    minPrice: getStr(sp.minPrice) ? Number(getStr(sp.minPrice)) : undefined,
    maxPrice: getStr(sp.maxPrice) ? Number(getStr(sp.maxPrice)) : undefined,
    inStock: getStr(sp.inStock) === "true" ? true : undefined,
    sort:
      (getStr(sp.sort) as "newest" | "price_asc" | "price_desc" | "featured") ||
      "featured",
    page: getStr(sp.page) ? Number(getStr(sp.page)) : 1,
    limit: 12,
  });

  return (
    <>
      <section className="relative bg-espresso text-alabaster overflow-hidden">
        {currentCategory.imageUrl && (
          <img
            src={currentCategory.imageUrl}
            alt={currentCategory.name}
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/85 to-espresso/50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-22">
          <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2.5">
            Rostvyn Collection • {currentCategory.productCount} Releases
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-alabaster mb-4">
            {currentCategory.name}
          </h1>
          <p className="text-sm sm:text-base text-alabaster/80 max-w-2xl leading-relaxed">
            {CATEGORY_DESCRIPTIONS[currentCategory.slug] ??
              "Small-batch specialty coffee roasted to order and dispatched fresh."}
          </p>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted">
            Loading collection...
          </div>
        }
      >
        <ShopCatalogClient
          initialData={initialData}
          categories={categories}
          currencyCode={settings.currencyCode}
          lockedCategorySlug={categorySlug}
        />
      </Suspense>
    </>
  );
}
