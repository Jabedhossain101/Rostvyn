"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Coffee,
  Menu,
  Search,
  ShoppingBag,
  X,
  Check,
} from "lucide-react";
import type { PublicStoreSettings, SerializedCategory } from "@/lib/storefront";
import { useCartStore } from "@/store/cartStore";

interface StorefrontHeaderProps {
  settings: PublicStoreSettings;
  categories: SerializedCategory[];
}

export function StorefrontHeader({
  settings,
  categories,
}: StorefrontHeaderProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.openCart);
  const lastAddedNotice = useCartStore((s) => s.lastAddedNotice);
  const clearNotice = useCartStore((s) => s.clearNotice);

  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!lastAddedNotice) return;
    const timer = setTimeout(() => clearNotice(), 3200);
    return () => clearTimeout(timer);
  }, [lastAddedNotice, clearNotice]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMobileMenuOpen(false);
        setShopDropdownOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const totalItems = mounted
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = searchTerm.trim();
    setSearchOpen(false);
    setMobileMenuOpen(false);
    if (q) {
      router.push(`/shop?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/shop");
    }
  }

  return (
    <>
      {settings.announcementText && (
        <div className="bg-espresso text-alabaster text-[11px] sm:text-xs tracking-[0.14em] uppercase text-center px-4 py-2.5">
          {settings.announcementText}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-stone-border bg-alabaster/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden inline-flex items-center justify-center p-2 -ml-2 text-espresso hover:text-terracotta transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta"
            >
              <Coffee
                className="h-5 w-5 text-terracotta transition-transform group-hover:scale-105"
                strokeWidth={1.75}
              />
              <span className="font-serif text-2xl sm:text-[28px] font-semibold tracking-tight text-espresso">
                {settings.storeName}
              </span>
            </Link>

            {/* Desktop Primary Navigation */}
            <nav
              aria-label="Main navigation"
              className="hidden lg:flex items-center gap-8"
            >
              <div
                className="relative"
                onMouseEnter={() => setShopDropdownOpen(true)}
                onMouseLeave={() => setShopDropdownOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setShopDropdownOpen((prev) => !prev)}
                  aria-expanded={shopDropdownOpen}
                  className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-roast hover:text-terracotta transition-colors py-2 cursor-pointer"
                >
                  Shop
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {shopDropdownOpen && (
                  <div className="absolute left-0 top-full pt-1 w-64 z-50">
                    <div className="border border-stone-border bg-surface shadow-lg py-2">
                      <Link
                        href="/shop"
                        onClick={() => setShopDropdownOpen(false)}
                        className="block px-5 py-2.5 text-xs uppercase tracking-[0.14em] font-medium text-espresso hover:bg-linen hover:text-terracotta transition-colors"
                      >
                        All Fresh Roasts
                      </Link>
                      <div className="my-1 border-t border-stone-border" />
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/shop/${cat.slug}`}
                          onClick={() => setShopDropdownOpen(false)}
                          className="flex items-center justify-between px-5 py-2.5 text-sm text-roast hover:bg-linen hover:text-terracotta transition-colors"
                        >
                          <span>{cat.name}</span>
                          <span className="text-xs text-muted">
                            {cat.productCount}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/bundles"
                className="text-xs uppercase tracking-[0.16em] text-roast hover:text-terracotta transition-colors"
              >
                Bundles
              </Link>
              <Link
                href="/brew-guide"
                className="text-xs uppercase tracking-[0.16em] text-roast hover:text-terracotta transition-colors"
              >
                Brew Guide
              </Link>
              <Link
                href="/our-story"
                className="text-xs uppercase tracking-[0.16em] text-roast hover:text-terracotta transition-colors"
              >
                Our Story
              </Link>
              <Link
                href="/contact"
                className="text-xs uppercase tracking-[0.16em] text-roast hover:text-terracotta transition-colors"
              >
                Contact
              </Link>
            </nav>

            {/* Right Utility Icons */}
            <div className="flex items-center gap-3 sm:gap-5">
              <Link
                href="/track"
                className="hidden md:inline-block text-xs uppercase tracking-[0.14em] text-muted hover:text-espresso transition-colors"
              >
                Track Order
              </Link>

              <button
                type="button"
                onClick={() => setSearchOpen((prev) => !prev)}
                className="p-2 text-espresso hover:text-terracotta transition-colors cursor-pointer"
                aria-label="Search coffee catalog"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
              </button>

              <button
                type="button"
                onClick={openCart}
                className="relative p-2 text-espresso hover:text-terracotta transition-colors cursor-pointer"
                aria-label={`Shopping bag with ${totalItems} items`}
              >
                <ShoppingBag
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  strokeWidth={1.75}
                />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-semibold text-alabaster">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Inline Search Bar */}
          {searchOpen && (
            <div className="border-t border-stone-border py-4">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-3 max-w-2xl mx-auto"
              >
                <Search className="h-4 w-4 text-muted shrink-0" />
                <input
                  type="search"
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search single origins, tasting notes, espresso blends..."
                  className="w-full bg-transparent text-sm text-espresso placeholder:text-muted focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-espresso text-alabaster px-4 py-2 text-xs uppercase tracking-[0.14em] hover:bg-roast transition-colors cursor-pointer"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="p-1.5 text-muted hover:text-espresso cursor-pointer"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* Subtle Add-to-Bag Confirmation Toast */}
      {lastAddedNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 border border-stone-border bg-espresso text-alabaster px-5 py-3.5 shadow-xl max-w-sm"
        >
          <Check className="h-4 w-4 text-terracotta shrink-0" />
          <span className="text-xs tracking-wide">{lastAddedNotice}</span>
          <button
            type="button"
            onClick={() => {
              clearNotice();
              openCart();
            }}
            className="text-xs underline underline-offset-4 text-alabaster/90 hover:text-white ml-2 shrink-0 cursor-pointer"
          >
            View Bag
          </button>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-espresso/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-alabaster h-full border-r border-stone-border flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-stone-border">
                <span className="font-serif text-2xl font-semibold text-espresso">
                  {settings.storeName}
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-1.5 text-espresso hover:text-terracotta cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-6 space-y-1">
                <Link
                  href="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 text-xs uppercase tracking-[0.16em] font-semibold text-espresso"
                >
                  Shop All Roasts
                </Link>
                <div className="pl-3 space-y-1 pb-3 border-b border-stone-border">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/shop/${cat.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2 text-sm text-roast hover:text-terracotta"
                    >
                      <span>{cat.name}</span>
                      <span className="text-xs text-muted">
                        {cat.productCount}
                      </span>
                    </Link>
                  ))}
                </div>

                {[
                  { href: "/bundles", label: "Bundles & Gift Sets" },
                  { href: "/brew-guide", label: "Brewing & Grind Guide" },
                  { href: "/our-story", label: "Our Roastery Story" },
                  { href: "/track", label: "Track Order" },
                  { href: "/faq", label: "Help & FAQs" },
                  { href: "/contact", label: "Contact & Wholesale" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2.5 text-sm text-roast hover:text-terracotta transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-stone-border text-xs text-muted space-y-1">
              {settings.contactEmail && <p>{settings.contactEmail}</p>}
              {settings.contactPhone && <p>{settings.contactPhone}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
