import { Suspense } from "react";
import type { Metadata } from "next";
import { RoastLevel } from "@prisma/client";
import {
  getActiveCategories,
  getPublicSettings,
  queryProducts,
} from "@/lib/storefront";
import { ShopCatalogClient } from "@/components/storefront/ShopCatalogClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Fresh Roasts",
  description:
    "Explore Rostvyn's full collection of small-batch single-origin coffee, signature espresso blends, decaf, tasting bundles, and ceramic brewing gear.",
};

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getStr(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const sp = await searchParams;
  const roastParam = getStr(sp.roast)?.toUpperCase();
  const validRoast =
    roastParam === "LIGHT" || roastParam === "MEDIUM" || roastParam === "DARK"
      ? (roastParam as RoastLevel)
      : undefined;

  const sortParam = getStr(sp.sort);
  const validSort =
    sortParam === "newest" ||
    sortParam === "price_asc" ||
    sortParam === "price_desc" ||
    sortParam === "featured"
      ? sortParam
      : "featured";

  const [settings, categories, initialData] = await Promise.all([
    getPublicSettings(),
    getActiveCategories(),
    queryProducts({
      q: getStr(sp.q),
      category: getStr(sp.category),
      roast: validRoast,
      grind: getStr(sp.grind),
      minPrice: getStr(sp.minPrice) ? Number(getStr(sp.minPrice)) : undefined,
      maxPrice: getStr(sp.maxPrice) ? Number(getStr(sp.maxPrice)) : undefined,
      inStock: getStr(sp.inStock) === "true" ? true : undefined,
      sort: validSort,
      page: getStr(sp.page) ? Number(getStr(sp.page)) : 1,
      limit: 12,
    }),
  ]);

  return (
    <>
      <section className="bg-linen border-b border-stone-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
          <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2.5">
            Small-Batch Roastery Catalog
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-espresso mb-3">
            Shop Fresh Roasts
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            Every lot is roasted to order on {settings.storyData.roastDays} and
            sealed with a one-way degassing valve for peak aromatics.
          </p>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted">
            Loading roastery catalog...
          </div>
        }
      >
        <ShopCatalogClient
          initialData={initialData}
          categories={categories}
          currencyCode={settings.currencyCode}
        />
      </Suspense>
    </>
  );
}
