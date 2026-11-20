import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clock, Droplets, Flame, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Brewing & Grind Guide",
  description:
    "Precision extraction recipes, coffee-to-water ratios, and grind calibration for Whole Bean, Espresso, AeroPress, V60 Pour-Over, and French Press.",
};

const BREW_METHODS = [
  {
    id: "whole-bean",
    name: "Whole Bean (Home Grinder)",
    grind: "Grind Fresh Immediately Before Brewing",
    ratio: "1:2 – 1:17",
    dose: "Varies by brewer",
    temp: "90–96°C",
    time: "30s – 4:00",
    roastMatch: "All Roast Levels",
    shopHref: "/shop?grind=Whole+Bean",
    shopLabel: "Shop Whole Bean",
    tips: "Grinding whole beans within 60 seconds of brewing preserves up to 60% more volatile aromatics. Use a conical or flat burr grinder for uniform particle distribution.",
  },
  {
    id: "v60",
    name: "V60 Pour-Over",
    grind: "Medium-Fine (Table Salt)",
    ratio: "1:16",
    dose: "15g coffee → 240g water",
    temp: "94°C / 201°F",
    time: "2:45 – 3:10",
    roastMatch: "Light Single Origins",
    shopHref: "/shop?roast=LIGHT&grind=Filter",
    shopLabel: "Shop Light Filter Roasts",
    tips: "Rinse the paper filter thoroughly with hot water. Bloom with 45g of water for 40 seconds, then pour in slow concentric circles in two pulses to maintain a flat bed.",
  },
  {
    id: "espresso",
    name: "Modern Espresso",
    grind: "Fine (Powdered Sugar)",
    ratio: "1:2",
    dose: "18g coffee → 36g yield",
    temp: "93°C / 199°F",
    time: "27 – 31 seconds",
    roastMatch: "Medium & Signature Blends",
    shopHref: "/shop?roast=MEDIUM&grind=Espresso",
    shopLabel: "Shop Espresso Roasts",
    tips: "Rest espresso beans 7–10 days post-roast for stable crema and balanced pressure. If the shot runs fast and sour, grind finer; if slow and bitter, coarsen slightly.",
  },
  {
    id: "aeropress",
    name: "AeroPress",
    grind: "Medium-Fine",
    ratio: "1:14",
    dose: "16g coffee → 225g water",
    temp: "92°C / 198°F",
    time: "2:00 total",
    roastMatch: "Light & Medium Roasts",
    shopHref: "/shop?grind=Filter",
    shopLabel: "Shop AeroPress-Ready Roasts",
    tips: "Steep with gentle agitation for 1:15, then press steadily over 30–40 seconds until you hear the hiss. Produces a clean, syrupy cup with zero grit.",
  },
  {
    id: "french-press",
    name: "French Press & Cold Immersion",
    grind: "Coarse (Sea Salt)",
    ratio: "1:15 (Hot) / 1:8 (Cold)",
    dose: "30g coffee → 450g water",
    temp: "91°C / 196°F (or Cold)",
    time: "4:00 (Hot) / 16h (Cold)",
    roastMatch: "Medium & Dark Roasts",
    shopHref: "/shop?roast=DARK",
    shopLabel: "Shop Bold & Dark Roasts",
    tips: "Break the crust at 4:00, skim surface foam with two spoons, wait 3 more minutes for grounds to settle, then plunge just to the surface without agitating the silt.",
  },
];

export default function BrewGuidePage() {
  return (
    <>
      <section className="bg-linen border-b border-stone-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-22">
          <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-3">
            Rostvyn Extraction Manual
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-espresso mb-4 max-w-3xl">
            Brewing &amp; Grind Guide
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            Dial in your morning ritual with Q-Grader calibrated ratios,
            temperatures, and grind targets across every brewing method.
          </p>
        </div>
      </section>

      {/* Ratio Quick-Reference Table */}
      <section className="py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-medium text-espresso mb-6">
            Quick-Reference Ratio Table
          </h2>

          <div className="overflow-x-auto border border-stone-border bg-surface">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-border bg-linen text-[11px] uppercase tracking-[0.16em] text-roast">
                  <th className="py-4 px-5 font-semibold">Method</th>
                  <th className="py-4 px-5 font-semibold">Grind Size</th>
                  <th className="py-4 px-5 font-semibold">Ratio</th>
                  <th className="py-4 px-5 font-semibold">Water Temp</th>
                  <th className="py-4 px-5 font-semibold">Target Time</th>
                  <th className="py-4 px-5 font-semibold">Ideal Roast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-border">
                {BREW_METHODS.map((m) => (
                  <tr key={m.id} className="hover:bg-alabaster/70">
                    <td className="py-4 px-5 font-medium text-espresso">
                      <a href={`#${m.id}`} className="hover:text-terracotta">
                        {m.name}
                      </a>
                    </td>
                    <td className="py-4 px-5 text-roast">{m.grind}</td>
                    <td className="py-4 px-5 text-espresso font-medium">
                      {m.ratio}
                    </td>
                    <td className="py-4 px-5 text-muted">{m.temp}</td>
                    <td className="py-4 px-5 text-muted">{m.time}</td>
                    <td className="py-4 px-5 text-terracotta text-xs uppercase tracking-wider">
                      {m.roastMatch}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detailed Method Cards */}
      <section className="pb-20 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          {BREW_METHODS.map((method) => (
            <article
              key={method.id}
              id={method.id}
              className="scroll-mt-28 border border-stone-border bg-surface p-7 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta mb-2">
                  {method.grind}
                </p>
                <h3 className="font-serif text-3xl font-medium text-espresso mb-3">
                  {method.name}
                </h3>
                <p className="text-sm sm:text-base text-muted leading-relaxed mb-6">
                  {method.tips}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-stone-border text-xs">
                  <div className="flex items-start gap-2">
                    <Scale className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
                    <div>
                      <p className="text-muted">Dose</p>
                      <p className="font-medium text-espresso mt-0.5">
                        {method.dose}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Droplets className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
                    <div>
                      <p className="text-muted">Water Temp</p>
                      <p className="font-medium text-espresso mt-0.5">
                        {method.temp}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
                    <div>
                      <p className="text-muted">Brew Time</p>
                      <p className="font-medium text-espresso mt-0.5">
                        {method.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Flame className="h-4 w-4 text-terracotta shrink-0 mt-0.5" />
                    <div>
                      <p className="text-muted">Best Match</p>
                      <p className="font-medium text-espresso mt-0.5">
                        {method.roastMatch}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 lg:text-right">
                <Link
                  href={method.shopHref}
                  className="inline-flex items-center gap-2 bg-espresso text-alabaster px-6 py-3.5 text-xs uppercase tracking-[0.16em] hover:bg-roast transition-colors"
                >
                  {method.shopLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
