import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Award, Gift, Truck } from "lucide-react";
import { getPublicSettings, queryProducts } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/ProductCard";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bundles & Gift Sets",
  description:
    "Curated specialty coffee tasting flights, pour-over starter kits, and luxury gift boxes with built-in bundle savings.",
};

export default async function BundlesPage() {
  const [settings, bundlesResult] = await Promise.all([
    getPublicSettings(),
    queryProducts({ category: "bundles", sort: "featured", limit: 12 }),
  ]);

  return (
    <>
      <section className="bg-linen border-b border-stone-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-22">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-terracotta mb-3">
            <Gift className="h-3.5 w-3.5" />
            Curated Tasting Flights &amp; Gifting
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-espresso mb-4 max-w-3xl">
            Tasting Bundles &amp; Ritual Gift Sets
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            Discover our seasonal micro-lots side-by-side or gift a complete
            pour-over ritual. Every bundle includes built-in savings and
            qualifies for complimentary tracked delivery over{" "}
            {formatCurrency(
              settings.freeShippingThreshold,
              settings.currencyCode
            )}
            .
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
            {[
              {
                icon: Award,
                title: "Save Up to 16%",
                body: "Automatic bundle pricing compared to purchasing individual bags and gear.",
              },
              {
                icon: Gift,
                title: "Embossed Gift Presentation",
                body: "Arrives in minimalist stone-toned packaging with printed origin tasting cards.",
              },
              {
                icon: Truck,
                title: "Complimentary Shipping",
                body: `Orders over ${formatCurrency(
                  settings.freeShippingThreshold,
                  settings.currencyCode
                )} ship free on roast days.`,
              },
            ].map((perk) => {
              const Icon = perk.icon;
              return (
                <div
                  key={perk.title}
                  className="border border-stone-border bg-surface p-6 flex items-start gap-3.5"
                >
                  <Icon className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
                  <div>
                    <h2 className="font-serif text-xl font-medium text-espresso">
                      {perk.title}
                    </h2>
                    <p className="text-xs text-muted mt-1 leading-relaxed">
                      {perk.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {bundlesResult.products.length === 0 ? (
            <div className="border border-stone-border bg-surface p-12 text-center">
              <p className="font-serif text-2xl text-espresso mb-3">
                New Seasonal Bundles Arriving Soon
              </p>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-espresso text-alabaster px-6 py-3 text-xs uppercase tracking-[0.16em]"
              >
                Explore Single Origins
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bundlesResult.products.map((bundle) => (
                <ProductCard
                  key={bundle.id}
                  product={bundle}
                  currencyCode={settings.currencyCode}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
