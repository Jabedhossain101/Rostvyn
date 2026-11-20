import { Prisma, ReviewStatus, RoastLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface PaymentAccountInfo {
  label: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingOrSwift?: string;
  instructions?: string;
}

export interface HeroData {
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
}

export interface StoryData {
  title: string;
  body: string;
  roastDays: string;
}

export interface PolicyTexts {
  privacy?: string;
  terms?: string;
  returns?: string;
  shipping?: string;
}

export interface PublicStoreSettings {
  storeName: string;
  currencyCode: string;
  freeShippingThreshold: number;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  metroDeliveryFee: number;
  nationalDeliveryFee: number;
  paymentAccounts: PaymentAccountInfo[];
  announcementText: string | null;
  heroData: HeroData;
  storyData: StoryData;
  policyTexts: PolicyTexts;
}

export interface SerializedVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  priceOverride: number | null;
  effectivePrice: number;
  stockCount: number;
  isActive: boolean;
}

export interface SerializedProduct {
  id: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  name: string;
  slug: string;
  description: string;
  roastLevel: RoastLevel | null;
  originNotes: string | null;
  basePrice: number;
  comparePrice: number | null;
  images: string[];
  isFeatured: boolean;
  createdAt: string;
  variants: SerializedVariant[];
  totalStock: number;
  inStock: boolean;
  averageRating: number;
  reviewCount: number;
}

export interface SerializedCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  sortOrder: number;
  productCount: number;
}

export interface SerializedReview {
  id: string;
  productId: string;
  productName?: string;
  productSlug?: string;
  authorName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  isFeatured: boolean;
  createdAt: string;
}

const DEFAULT_HERO: HeroData = {
  eyebrow: "SMALL-BATCH ARTISAN ROASTERY",
  headline: "Precision-Roasted Single Origins, Delivered at Peak Aromatics.",
  subheadline:
    "Sourced directly from high-altitude micro-lots across Ethiopia, Colombia, and Kenya. Roasted every Tuesday and Friday.",
  ctaLabel: "Shop Fresh Roasts",
  ctaHref: "/shop",
  imageUrl:
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=85",
};

const DEFAULT_STORY: StoryData = {
  title: "Crafted Between Science and Terroir",
  body: "Every lot at Rostvyn is profiled on cast-iron drum roasters, cupped blind by Q-Graders, and rested for optimal degassing before dispatch.",
  roastDays: "Tuesday & Friday",
};

export async function getPublicSettings(): Promise<PublicStoreSettings> {
  const row = await prisma.storeSettings.findUnique({
    where: { id: "default" },
  });

  if (!row) {
    return {
      storeName: "Rostvyn",
      currencyCode: "USD",
      freeShippingThreshold: 45,
      contactPhone: "+1 (415) 890-4421",
      contactEmail: "concierge@rostvyn.com",
      address: "418 Alder Street, Portland, OR 97204, United States",
      metroDeliveryFee: 5,
      nationalDeliveryFee: 12,
      paymentAccounts: [],
      announcementText:
        "Free Delivery on Orders Over $45 • Roasted Every Tuesday & Friday",
      heroData: DEFAULT_HERO,
      storyData: DEFAULT_STORY,
      policyTexts: {},
    };
  }

  const rawHero = (row.heroData ?? {}) as Partial<HeroData>;
  const rawStory = (row.storyData ?? {}) as Partial<StoryData>;
  const rawPolicies = (row.policyTexts ?? {}) as PolicyTexts;
  const rawAccounts = Array.isArray(row.paymentAccounts)
    ? (row.paymentAccounts as unknown as PaymentAccountInfo[])
    : [];

  return {
    storeName: row.storeName,
    currencyCode: row.currencyCode,
    freeShippingThreshold: Number(row.freeShippingThreshold),
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail,
    address: row.address,
    metroDeliveryFee: Number(row.metroDeliveryFee),
    nationalDeliveryFee: Number(row.nationalDeliveryFee),
    paymentAccounts: rawAccounts,
    announcementText: row.announcementText,
    heroData: {
      eyebrow: rawHero.eyebrow || DEFAULT_HERO.eyebrow,
      headline: rawHero.headline || DEFAULT_HERO.headline,
      subheadline: rawHero.subheadline || DEFAULT_HERO.subheadline,
      ctaLabel: rawHero.ctaLabel || DEFAULT_HERO.ctaLabel,
      ctaHref: rawHero.ctaHref || DEFAULT_HERO.ctaHref,
      imageUrl: rawHero.imageUrl || DEFAULT_HERO.imageUrl,
    },
    storyData: {
      title: rawStory.title || DEFAULT_STORY.title,
      body: rawStory.body || DEFAULT_STORY.body,
      roastDays: rawStory.roastDays || DEFAULT_STORY.roastDays,
    },
    policyTexts: rawPolicies,
  };
}

export async function getActiveCategories(): Promise<SerializedCategory[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          products: { where: { isActive: true } },
        },
      },
    },
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    imageUrl: cat.imageUrl,
    sortOrder: cat.sortOrder,
    productCount: cat._count.products,
  }));
}

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: { select: { id: true; name: true; slug: true } };
    variants: { where: { isActive: true } };
    reviews: {
      where: { status: "APPROVED" };
      select: { rating: true };
    };
  };
}>;

function serializeProduct(p: ProductWithRelations): SerializedProduct {
  const basePrice = Number(p.basePrice);
  const comparePrice = p.comparePrice !== null ? Number(p.comparePrice) : null;

  const variants: SerializedVariant[] = p.variants.map((v) => {
    const priceOverride = v.priceOverride !== null ? Number(v.priceOverride) : null;
    return {
      id: v.id,
      productId: v.productId,
      name: v.name,
      sku: v.sku,
      priceOverride,
      effectivePrice: priceOverride ?? basePrice,
      stockCount: v.stockCount,
      isActive: v.isActive,
    };
  });

  const totalStock = variants.reduce((sum, v) => sum + v.stockCount, 0);
  const reviewCount = p.reviews.length;
  const averageRating =
    reviewCount > 0
      ? Number(
          (
            p.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
          ).toFixed(1)
        )
      : 0;

  return {
    id: p.id,
    categoryId: p.categoryId,
    category: p.category,
    name: p.name,
    slug: p.slug,
    description: p.description,
    roastLevel: p.roastLevel,
    originNotes: p.originNotes,
    basePrice,
    comparePrice,
    images: p.images,
    isFeatured: p.isFeatured,
    createdAt: p.createdAt.toISOString(),
    variants,
    totalStock,
    inStock: totalStock > 0,
    averageRating,
    reviewCount,
  };
}

export interface ProductQueryFilters {
  q?: string;
  category?: string;
  roast?: RoastLevel;
  grind?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "featured";
  page?: number;
  limit?: number;
}

export interface ProductQueryResult {
  products: SerializedProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function queryProducts(
  filters: ProductQueryFilters = {}
): Promise<ProductQueryResult> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(48, Math.max(1, filters.limit ?? 12));
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    category: { isActive: true },
  };

  if (filters.q && filters.q.trim().length > 0) {
    const term = filters.q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { originNotes: { contains: term, mode: "insensitive" } },
    ];
  }

  if (filters.category) {
    where.category = { isActive: true, slug: filters.category };
  }

  if (filters.roast) {
    where.roastLevel = filters.roast;
  }

  if (filters.featured) {
    where.isFeatured = true;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.basePrice = {};
    if (filters.minPrice !== undefined) {
      where.basePrice.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.basePrice.lte = filters.maxPrice;
    }
  }

  if (filters.grind || filters.inStock) {
    const variantFilter: Prisma.ProductVariantWhereInput = { isActive: true };
    if (filters.grind) {
      variantFilter.name = { contains: filters.grind, mode: "insensitive" };
    }
    if (filters.inStock) {
      variantFilter.stockCount = { gt: 0 };
    }
    where.variants = { some: variantFilter };
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ createdAt: "desc" }];
  switch (filters.sort) {
    case "price_asc":
      orderBy = [{ basePrice: "asc" }];
      break;
    case "price_desc":
      orderBy = [{ basePrice: "desc" }];
      break;
    case "featured":
      orderBy = [{ isFeatured: "desc" }, { createdAt: "desc" }];
      break;
    case "newest":
    default:
      orderBy = [{ createdAt: "desc" }];
      break;
  }

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
        reviews: {
          where: { status: ReviewStatus.APPROVED },
          select: { rating: true },
        },
      },
    }),
  ]);

  return {
    products: rows.map(serializeProduct),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getProductBySlug(slug: string): Promise<{
  product: SerializedProduct;
  reviews: SerializedReview[];
  crossSell: SerializedProduct[];
} | null> {
  const row = await prisma.product.findFirst({
    where: {
      slug,
      isActive: true,
      category: { isActive: true },
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
      reviews: {
        where: { status: ReviewStatus.APPROVED },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!row) return null;

  const product = serializeProduct(row);
  const reviews: SerializedReview[] = row.reviews.map((r) => ({
    id: r.id,
    productId: r.productId,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    isVerifiedPurchase: r.isVerifiedPurchase,
    isFeatured: r.isFeatured,
    createdAt: r.createdAt.toISOString(),
  }));

  // 3-4 paired cross-sell items (prefer different category / complementary roasts or brewing gear)
  const crossSellRows = await prisma.product.findMany({
    where: {
      isActive: true,
      category: { isActive: true },
      id: { not: row.id },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 4,
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
      reviews: {
        where: { status: ReviewStatus.APPROVED },
        select: { rating: true },
      },
    },
  });

  return {
    product,
    reviews,
    crossSell: crossSellRows.map(serializeProduct),
  };
}

export async function getFeaturedReviews(): Promise<{
  reviews: SerializedReview[];
  aggregateRating: number;
  totalApprovedCount: number;
}> {
  const [featuredRows, aggregate] = await Promise.all([
    prisma.productReview.findMany({
      where: {
        status: ReviewStatus.APPROVED,
        isFeatured: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        product: { select: { name: true, slug: true } },
      },
    }),
    prisma.productReview.aggregate({
      where: { status: ReviewStatus.APPROVED },
      _avg: { rating: true },
      _count: { id: true },
    }),
  ]);

  return {
    reviews: featuredRows.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      productSlug: r.product.slug,
      authorName: r.authorName,
      rating: r.rating,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      isFeatured: r.isFeatured,
      createdAt: r.createdAt.toISOString(),
    })),
    aggregateRating: Number((aggregate._avg.rating ?? 5).toFixed(1)),
    totalApprovedCount: aggregate._count.id,
  };
}
