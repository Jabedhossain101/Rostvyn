import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Calendar, Globe2, Leaf, ShieldCheck } from "lucide-react";
import { getPublicSettings } from "@/lib/storefront";
import { NewsletterBand } from "@/components/storefront/NewsletterBand";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Story & Roastery",
  description:
    "Discover Rostvyn's small-batch roasting philosophy, direct-trade farm partnerships, freshness-date guarantee, and sustainable packaging.",
};

export default async function OurStoryPage() {
  const settings = await getPublicSettings();

  return (
    <>
      <section className="relative bg-espresso text-alabaster overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=1600&q=85"
          alt="Rostvyn artisan coffee roastery"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/75 to-espresso/40" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
          <p className="text-[11px] uppercase tracking-[0.26em] text-terracotta mb-4">
            Our Roastery &amp; Sourcing
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl font-medium text-alabaster leading-tight mb-6">
            {settings.storyData.title}
          </h1>
          <p className="text-base sm:text-lg text-alabaster/80 max-w-2xl mx-auto leading-relaxed">
            {settings.storyData.body}
          </p>
        </div>
      </section>

      {/* Four Pillars */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Calendar,
                eyebrow: "Small-Batch Cadence",
                title: `Roasted Every ${settings.storyData.roastDays}`,
                body: "We never warehouse stale inventory. Green lots are held in climate-controlled grain-pro bags and roasted strictly to order on cast-iron drum roasters twice weekly, with every bag stamped with its exact roast date.",
              },
              {
                icon: Globe2,
                eyebrow: "Direct-Trade Partnerships",
                title: "Transparent Farm-Gate Premiums",
                body: "We build multi-harvest relationships with washing stations in Gedeb (Ethiopia), Huila (Colombia), and Huehuetenango (Guatemala), paying well above specialty commodity benchmarks to reward meticulous hand-sorting.",
              },
              {
                icon: ShieldCheck,
                eyebrow: "Sensory Quality Assurance",
                title: "Blind Cupped by Q-Graders",
                body: "Every production batch is cupped blind 24 hours after roasting to verify sweetness, clean finish, and moisture consistency before a single bag is sealed for dispatch.",
              },
              {
                icon: Leaf,
                eyebrow: "Stewardship & Packaging",
                title: "Low-Impact Materials & Afterburners",
                body: "Our roastery utilizes low-emission thermal afterburners and packs every release in recyclable matte barrier pouches fitted with one-way degassing valves.",
              },
            ].map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.title}
                  className="border border-stone-border bg-surface p-8 sm:p-10"
                >
                  <Icon
                    className="h-6 w-6 text-terracotta mb-5"
                    strokeWidth={1.75}
                  />
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted mb-2">
                    {pillar.eyebrow}
                  </p>
                  <h2 className="font-serif text-3xl font-medium text-espresso mb-4">
                    {pillar.title}
                  </h2>
                  <p className="text-sm sm:text-base text-muted leading-relaxed">
                    {pillar.body}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2.5 bg-espresso text-alabaster px-8 py-4 text-xs uppercase tracking-[0.18em] font-medium hover:bg-roast transition-colors"
            >
              Taste Current Releases
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <NewsletterBand source="our_story_page" />
    </>
  );
}
