import Link from "next/link";
import { Coffee, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { PublicStoreSettings, SerializedCategory } from "@/lib/storefront";

interface StorefrontFooterProps {
  settings: PublicStoreSettings;
  categories: SerializedCategory[];
}

export function StorefrontFooter({
  settings,
  categories,
}: StorefrontFooterProps) {
  return (
    <footer className="bg-espresso text-alabaster/90 border-t border-roast">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-5">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Coffee className="h-5 w-5 text-terracotta" strokeWidth={1.75} />
              <span className="font-serif text-2xl font-semibold tracking-tight text-alabaster">
                {settings.storeName}
              </span>
            </Link>
            <p className="text-sm text-alabaster/70 leading-relaxed">
              Small-batch specialty coffee roasted every{" "}
              {settings.storyData.roastDays}. Direct-trade micro-lots profiled
              for clarity, sweetness, and balance.
            </p>
            <div className="space-y-2 text-xs text-alabaster/70 pt-1">
              {settings.address && (
                <p className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-terracotta shrink-0 mt-0.5" />
                  <span>{settings.address}</span>
                </p>
              )}
              {settings.contactEmail && (
                <p className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-terracotta shrink-0" />
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="hover:text-alabaster transition-colors"
                  >
                    {settings.contactEmail}
                  </a>
                </p>
              )}
              {settings.contactPhone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-terracotta shrink-0" />
                  <span>{settings.contactPhone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-alabaster/50 mb-5">
              Roastery Shop
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/shop"
                  className="text-alabaster/80 hover:text-alabaster transition-colors"
                >
                  All Fresh Roasts
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/shop/${cat.slug}`}
                    className="text-alabaster/80 hover:text-alabaster transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/bundles"
                  className="text-alabaster/80 hover:text-alabaster transition-colors"
                >
                  Bundles &amp; Gift Sets
                </Link>
              </li>
            </ul>
          </div>

          {/* Explore & Care Column */}
          <div>
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-alabaster/50 mb-5">
              Craft &amp; Care
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/brew-guide"
                  className="text-alabaster/80 hover:text-alabaster transition-colors"
                >
                  Brewing &amp; Grind Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/our-story"
                  className="text-alabaster/80 hover:text-alabaster transition-colors"
                >
                  Our Roastery &amp; Sourcing
                </Link>
              </li>
              <li>
                <Link
                  href="/track"
                  className="text-alabaster/80 hover:text-alabaster transition-colors"
                >
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-alabaster/80 hover:text-alabaster transition-colors"
                >
                  Help &amp; FAQs
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-alabaster/80 hover:text-alabaster transition-colors"
                >
                  Contact &amp; Wholesale
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Payment Badges */}
          <div>
            <h3 className="font-sans text-xs uppercase tracking-[0.2em] text-alabaster/50 mb-5">
              Store Policies
            </h3>
            <ul className="space-y-3 text-sm mb-8">
              <li>
                <Link
                  href="/policies/shipping"
                  className="text-alabaster/80 hover:text-alabaster transition-colors"
                >
                  Shipping &amp; Roast Schedule
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/returns"
                  className="text-alabaster/80 hover:text-alabaster transition-colors"
                >
                  Returns &amp; Freshness Guarantee
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/privacy"
                  className="text-alabaster/80 hover:text-alabaster transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/terms"
                  className="text-alabaster/80 hover:text-alabaster transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>

            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.18em] text-alabaster/50">
                Accepted Payment Methods
              </p>
              <div className="flex flex-wrap gap-2">
                {["Cash on Delivery", "IBAN / Wire", "PayID / TrxID"].map(
                  (badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1 border border-alabaster/20 px-2.5 py-1 text-[11px] text-alabaster/80"
                    >
                      <ShieldCheck className="h-3 w-3 text-terracotta" />
                      {badge}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-alabaster/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-alabaster/55">
          <p>
            © {new Date().getFullYear()} {settings.storeName} Roastery. All
            rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span>Currency: {settings.currencyCode}</span>
            <Link
              href="/admin/login"
              className="hover:text-alabaster transition-colors"
            >
              Roastery Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
