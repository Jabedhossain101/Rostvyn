"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ROAST_PROFILES = [
  {
    key: "LIGHT",
    title: "Light & Fruity",
    subtitle: "High-Elevation Single Origins",
    description:
      "Delicate, tea-like clarity that preserves the origin's natural terroir. Expect vibrant citrus, stone fruit, and jasmine florals—ideal for V60 Pour-Over and Chemex.",
    notes: ["White Jasmine", "Bergamot", "Blood Orange", "Stone Fruit"],
    acidity: 88,
    body: 42,
    sweetness: 78,
    recommendedBrew: "Pour-Over V60 • Filter • AeroPress",
  },
  {
    key: "MEDIUM",
    title: "Medium & Balanced",
    subtitle: "Signature Espresso & All-Day Cups",
    description:
      "Caramelized sweetness harmonized with structured acidity. Rich milk-chocolate body with toasted nut depth—versatile across espresso, AeroPress, and batch brew.",
    notes: ["Dark Chocolate", "Toasted Hazelnut", "Caramel", "Dried Fig"],
    acidity: 54,
    body: 76,
    sweetness: 90,
    recommendedBrew: "Espresso • Flat White • AeroPress",
  },
  {
    key: "DARK",
    title: "Dark & Bold",
    subtitle: "Slow-Developed Classic Intensity",
    description:
      "Extended development past first crack without scorching. Velvety, full-bodied, low-acidity cups with bittersweet cocoa, smoked cedar, and lingering molasses.",
    notes: ["Bittersweet Cocoa", "Molasses", "Cedar", "Velvet Crema"],
    acidity: 22,
    body: 95,
    sweetness: 72,
    recommendedBrew: "Espresso • French Press • Moka Pot",
  },
] as const;

export function RoastProfileExplorer() {
  const [activeKey, setActiveKey] = useState<"LIGHT" | "MEDIUM" | "DARK">("LIGHT");
  const current =
    ROAST_PROFILES.find((p) => p.key === activeKey) ?? ROAST_PROFILES[0];

  return (
    <section className="py-20 lg:py-24 bg-linen border-y border-stone-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-terracotta mb-2.5">
              Sensory Spectrum
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-espresso">
              Shop by Roast Profile
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Roast profile levels"
            className="inline-flex border border-stone-border bg-surface p-1 self-start"
          >
            {ROAST_PROFILES.map((profile) => {
              const selected = profile.key === activeKey;
              return (
                <button
                  key={profile.key}
                  role="tab"
                  aria-selected={selected}
                  type="button"
                  onClick={() => setActiveKey(profile.key)}
                  className={`px-4 sm:px-6 py-2.5 text-xs uppercase tracking-[0.14em] transition-colors cursor-pointer ${
                    selected
                      ? "bg-espresso text-alabaster"
                      : "text-roast hover:text-terracotta"
                  }`}
                >
                  {profile.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-surface border border-stone-border p-8 sm:p-10 lg:p-12">
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-terracotta mb-2">
                {current.subtitle}
              </p>
              <h3 className="font-serif text-3xl sm:text-4xl font-medium text-espresso mb-4">
                {current.title}
              </h3>
              <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl">
                {current.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {current.notes.map((note) => (
                  <span
                    key={note}
                    className="border border-stone-border bg-alabaster px-3 py-1 text-xs text-roast"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-border flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  Recommended Methods
                </p>
                <p className="text-sm font-medium text-espresso mt-0.5">
                  {current.recommendedBrew}
                </p>
              </div>
              <Link
                href={`/shop?roast=${current.key}`}
                className="inline-flex items-center gap-2 bg-espresso text-alabaster px-6 py-3 text-xs uppercase tracking-[0.16em] hover:bg-roast transition-colors"
              >
                Explore {current.key} Roasts
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Flavor Intensity Indicators */}
          <div className="lg:col-span-5 bg-alabaster border border-stone-border p-6 sm:p-8 flex flex-col justify-center space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-roast font-medium">
              Cupping Intensity Index
            </p>
            {[
              { label: "Brightness & Acidity", value: current.acidity },
              { label: "Body & Mouthfeel", value: current.body },
              { label: "Natural Sweetness", value: current.sweetness },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-roast">{metric.label}</span>
                  <span className="font-medium text-espresso">
                    {metric.value}/100
                  </span>
                </div>
                <div className="h-1.5 w-full bg-stone-border overflow-hidden">
                  <div
                    className="h-full bg-terracotta transition-all duration-500"
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
