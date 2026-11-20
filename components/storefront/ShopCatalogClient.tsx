"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Search,
  X,
} from "lucide-react";
import type {
  ProductQueryResult,
  SerializedCategory,
  SerializedProduct,
} from "@/lib/storefront";
import { ProductCard } from "./ProductCard";
import { QuickViewModal } from "./QuickViewModal";

interface ShopCatalogClientProps {
  initialData: ProductQueryResult;
  categories: SerializedCategory[];
  currencyCode: string;
  lockedCategorySlug?: string;
}

const ROAST_OPTIONS = [
  { value: "", label: "All Roasts" },
  { value: "LIGHT", label: "Light" },
  { value: "MEDIUM", label: "Medium" },
  { value: "DARK", label: "Dark" },
];

const GRIND_OPTIONS = [
  { value: "", label: "Any Grind / Option" },
  { value: "Whole Bean", label: "Whole Bean" },
  { value: "Espresso", label: "Espresso Grind" },
  { value: "Filter", label: "Filter / Pour-Over" },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest Releases" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export function ShopCatalogClient({
  initialData,
  categories,
  currencyCode,
  lockedCategorySlug,
}: ShopCatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ProductQueryResult>(initialData);
  const [loading, setLoading] = useState(false);
  const [quickViewProduct, setQuickViewProduct] =
    useState<SerializedProduct | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(
    lockedCategorySlug ?? searchParams.get("category") ?? ""
  );
  const [roast, setRoast] = useState(searchParams.get("roast") ?? "");
  const [grind, setGrind] = useState(searchParams.get("grind") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "featured");
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1") || 1);

  const fetchProducts = useCallback(
    async (overrides?: {
      q?: string;
      category?: string;
      roast?: string;
      grind?: string;
      minPrice?: string;
      maxPrice?: string;
      inStock?: boolean;
      sort?: string;
      page?: number;
    }) => {
      const nextQ = overrides?.q !== undefined ? overrides.q : q;
      const nextCategory =
        lockedCategorySlug ??
        (overrides?.category !== undefined ? overrides.category : category);
      const nextRoast = overrides?.roast !== undefined ? overrides.roast : roast;
      const nextGrind = overrides?.grind !== undefined ? overrides.grind : grind;
      const nextMin =
        overrides?.minPrice !== undefined ? overrides.minPrice : minPrice;
      const nextMax =
        overrides?.maxPrice !== undefined ? overrides.maxPrice : maxPrice;
      const nextInStock =
        overrides?.inStock !== undefined ? overrides.inStock : inStock;
      const nextSort = overrides?.sort !== undefined ? overrides.sort : sort;
      const nextPage = overrides?.page !== undefined ? overrides.page : page;

      const params = new URLSearchParams();
      if (nextQ.trim()) params.set("q", nextQ.trim());
      if (nextCategory) params.set("category", nextCategory);
      if (nextRoast) params.set("roast", nextRoast);
      if (nextGrind) params.set("grind", nextGrind);
      if (nextMin.trim()) params.set("minPrice", nextMin.trim());
      if (nextMax.trim()) params.set("maxPrice", nextMax.trim());
      if (nextInStock) params.set("inStock", "true");
      if (nextSort && nextSort !== "featured") params.set("sort", nextSort);
      if (nextPage > 1) params.set("page", String(nextPage));

      const urlParams = new URLSearchParams(params);
      if (lockedCategorySlug) {
        urlParams.delete("category");
      }
      const queryString = urlParams.toString();
      const basePath = lockedCategorySlug
        ? `/shop/${lockedCategorySlug}`
        : "/shop";
      router.replace(queryString ? `${basePath}?${queryString}` : basePath, {
        scroll: false,
      });

      setLoading(true);
      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
          const json: ProductQueryResult = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    },
    [
      q,
      category,
      roast,
      grind,
      minPrice,
      maxPrice,
      inStock,
      sort,
      page,
      lockedCategorySlug,
      router,
    ]
  );

  // Sync if user navigates via header search to /shop?q=...
  useEffect(() => {
    const spQ = searchParams.get("q") ?? "";
    const spRoast = searchParams.get("roast") ?? "";
    const spGrind = searchParams.get("grind") ?? "";
    if (spQ !== q || spRoast !== roast || spGrind !== grind) {
      setQ(spQ);
      setRoast(spRoast);
      setGrind(spGrind);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleResetFilters() {
    setQ("");
    if (!lockedCategorySlug) setCategory("");
    setRoast("");
    setGrind("");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setSort("featured");
    setPage(1);
    fetchProducts({
      q: "",
      category: lockedCategorySlug ?? "",
      roast: "",
      grind: "",
      minPrice: "",
      maxPrice: "",
      inStock: false,
      sort: "featured",
      page: 1,
    });
  }

  const hasActiveFilters =
    Boolean(q.trim()) ||
    Boolean(!lockedCategorySlug && category) ||
    Boolean(roast) ||
    Boolean(grind) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    inStock;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Top Bar: Search + Sort + Mobile Filter Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            fetchProducts({ q, page: 1 });
          }}
          className="relative flex-1 max-w-md"
        >
          <Search className="h-4 w-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search origins, notes, blends..."
            aria-label="Search products"
            className="w-full border border-stone-border bg-surface pl-10 pr-20 py-2.5 text-sm text-espresso placeholder:text-muted focus:border-terracotta focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-espresso text-alabaster px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] hover:bg-roast cursor-pointer"
          >
            Go
          </button>
        </form>

        <div className="flex items-center justify-between md:justify-end gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center gap-2 border border-stone-border bg-surface px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-espresso cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>

          <div className="flex items-center gap-2.5">
            <label
              htmlFor="catalog-sort"
              className="text-xs uppercase tracking-[0.14em] text-muted hidden sm:inline"
            >
              Sort
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(e) => {
                const next = e.target.value;
                setSort(next);
                setPage(1);
                fetchProducts({ sort: next, page: 1 });
              }}
              className="border border-stone-border bg-surface px-3.5 py-2.5 text-xs text-espresso focus:border-terracotta focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Sidebar Filters */}
        <aside
          aria-label="Catalog filters"
          className={`lg:col-span-3 space-y-7 ${
            mobileFiltersOpen ? "block" : "hidden lg:block"
          }`}
        >
          {/* Category Filter */}
          {!lockedCategorySlug && (
            <div>
              <h2 className="font-sans text-xs uppercase tracking-[0.18em] font-semibold text-espresso mb-3">
                Category
              </h2>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCategory("");
                    setPage(1);
                    fetchProducts({ category: "", page: 1 });
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                    category === ""
                      ? "bg-espresso text-alabaster"
                      : "text-roast hover:bg-linen"
                  }`}
                >
                  <span>All Collections</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.slug);
                      setPage(1);
                      fetchProducts({ category: cat.slug, page: 1 });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                      category === cat.slug
                        ? "bg-espresso text-alabaster"
                        : "text-roast hover:bg-linen"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-xs ${
                        category === cat.slug ? "text-alabaster/75" : "text-muted"
                      }`}
                    >
                      {cat.productCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Roast Level Filter */}
          <div className="pt-5 border-t border-stone-border">
            <h2 className="font-sans text-xs uppercase tracking-[0.18em] font-semibold text-espresso mb-3">
              Roast Level
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {ROAST_OPTIONS.map((opt) => (
                <button
                  key={opt.value || "all"}
                  type="button"
                  onClick={() => {
                    setRoast(opt.value);
                    setPage(1);
                    fetchProducts({ roast: opt.value, page: 1 });
                  }}
                  className={`px-3 py-2 text-xs uppercase tracking-[0.12em] border transition-colors cursor-pointer ${
                    roast === opt.value
                      ? "border-espresso bg-espresso text-alabaster"
                      : "border-stone-border bg-surface text-roast hover:border-espresso"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grind Availability */}
          <div className="pt-5 border-t border-stone-border">
            <label
              htmlFor="grind-filter"
              className="block font-sans text-xs uppercase tracking-[0.18em] font-semibold text-espresso mb-3"
            >
              Grind / Format
            </label>
            <select
              id="grind-filter"
              value={grind}
              onChange={(e) => {
                const next = e.target.value;
                setGrind(next);
                setPage(1);
                fetchProducts({ grind: next, page: 1 });
              }}
              className="w-full border border-stone-border bg-surface px-3 py-2.5 text-sm text-espresso focus:border-terracotta focus:outline-none cursor-pointer"
            >
              {GRIND_OPTIONS.map((opt) => (
                <option key={opt.value || "any"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="pt-5 border-t border-stone-border">
            <h2 className="font-sans text-xs uppercase tracking-[0.18em] font-semibold text-espresso mb-3">
              Price Range ({currencyCode})
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                aria-label="Minimum price"
                className="w-full border border-stone-border bg-surface px-3 py-2 text-sm text-espresso focus:border-terracotta focus:outline-none"
              />
              <span className="text-muted text-xs">–</span>
              <input
                type="number"
                min={0}
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                aria-label="Maximum price"
                className="w-full border border-stone-border bg-surface px-3 py-2 text-sm text-espresso focus:border-terracotta focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setPage(1);
                fetchProducts({ minPrice, maxPrice, page: 1 });
              }}
              className="mt-2.5 w-full border border-stone-border bg-linen py-2 text-xs uppercase tracking-[0.14em] text-espresso hover:border-espresso transition-colors cursor-pointer"
            >
              Apply Price
            </button>
          </div>

          {/* In-Stock Toggle */}
          <div className="pt-5 border-t border-stone-border">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-roast">In Stock Only</span>
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => {
                  const next = e.target.checked;
                  setInStock(next);
                  setPage(1);
                  fetchProducts({ inStock: next, page: 1 });
                }}
                className="h-4 w-4 accent-terracotta cursor-pointer"
              />
            </label>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-rust hover:underline cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Clear All Filters
            </button>
          )}
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-6 text-xs text-muted">
            <span>
              Showing{" "}
              <strong className="text-espresso">{data.products.length}</strong>{" "}
              of <strong className="text-espresso">{data.pagination.total}</strong>{" "}
              roasts
            </span>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-terracotta">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating catalog...
              </span>
            )}
          </div>

          {data.products.length === 0 ? (
            <div className="border border-stone-border bg-surface p-12 text-center">
              <p className="font-serif text-2xl text-espresso mb-2">
                No Matching Roasts Found
              </p>
              <p className="text-sm text-muted mb-6">
                Try adjusting your roast profile, grind format, or search query.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="bg-espresso text-alabaster px-6 py-3 text-xs uppercase tracking-[0.16em] hover:bg-roast cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  currencyCode={currencyCode}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <nav
              aria-label="Catalog pagination"
              className="mt-12 flex items-center justify-center gap-3"
            >
              <button
                type="button"
                disabled={data.pagination.page <= 1 || loading}
                onClick={() => {
                  const next = data.pagination.page - 1;
                  setPage(next);
                  fetchProducts({ page: next });
                }}
                className="inline-flex items-center gap-1 border border-stone-border bg-surface px-4 py-2 text-xs uppercase tracking-[0.14em] text-espresso hover:border-espresso disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <span className="text-xs text-muted px-2">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={
                  data.pagination.page >= data.pagination.totalPages || loading
                }
                onClick={() => {
                  const next = data.pagination.page + 1;
                  setPage(next);
                  fetchProducts({ page: next });
                }}
                className="inline-flex items-center gap-1 border border-stone-border bg-surface px-4 py-2 text-xs uppercase tracking-[0.14em] text-espresso hover:border-espresso disabled:opacity-40 cursor-pointer"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </nav>
          )}
        </div>
      </div>

      <QuickViewModal
        product={quickViewProduct}
        currencyCode={currencyCode}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
