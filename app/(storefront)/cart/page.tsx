import type { Metadata } from "next";
import { getPublicSettings, queryProducts } from "@/lib/storefront";
import { CartPageClient } from "@/components/cart/CartPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your Roasting Bag",
  description:
    "Review your selected specialty coffee roasts, preview promo codes, and proceed to streamlined guest checkout.",
};

export default async function CartPage() {
  const [settings, gearResult, featuredResult] = await Promise.all([
    getPublicSettings(),
    queryProducts({ category: "brewing-gear", inStock: true, limit: 2 }),
    queryProducts({ featured: true, inStock: true, limit: 4 }),
  ]);

  // Combine brewing gear + complementary featured roasts (deduped, up to 4)
  const seen = new Set<string>();
  const crossSell = [...gearResult.products, ...featuredResult.products]
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    })
    .slice(0, 4);

  return (
    <>
      <section className="bg-linen border-b border-stone-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2">
            Roastery Dispatch
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-espresso">
            Your Roasting Bag
          </h1>
        </div>
      </section>

      <CartPageClient settings={settings} crossSell={crossSell} />
    </>
  );
}
