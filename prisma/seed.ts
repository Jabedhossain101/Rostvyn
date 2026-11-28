import {
  AdminRole,
  DiscountType,
  PrismaClient,
  ReviewStatus,
  RoastLevel,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Rostvyn database...");

  // 1. Admin Users (idempotent — guarantees demo Super Admin credentials stay synced)
  const superAdminHash = await bcrypt.hash("RostvynAdmin@2026", 12);
  const staffHash = await bcrypt.hash("RostvynStaff!2026", 12);

  const superAdmin = await prisma.adminUser.upsert({
    where: { email: "admin@rostvyn.com" },
    update: {
      passwordHash: superAdminHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      name: "Elena Vance",
      email: "admin@rostvyn.com",
      passwordHash: superAdminHash,
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  await prisma.adminUser.upsert({
    where: { email: "staff@rostvyn.com" },
    update: {},
    create: {
      name: "Marcus Sterling",
      email: "staff@rostvyn.com",
      passwordHash: staffHash,
      role: AdminRole.STAFF,
      isActive: true,
    },
  });

  // 2. Store Settings (singleton default row)
  const policyTextsData = {
    shipping:
      "Orders placed before 12:00 PM on roast days (Tuesday & Friday) are roasted, rested, and dispatched the same evening. Metro delivery arrives in 1–2 business days; National and Regional shipments arrive in 3–5 business days with full tracking. Free shipping automatically applies on qualifying orders over the store threshold.",
    returns:
      "Because specialty coffee is a perishable agricultural product roasted to order, we cannot accept returns on opened bags. However, if your order arrives damaged, incorrect, or below our sensory standards, please contact concierge@rostvyn.com within 14 days of delivery with your Order Reference (RV-...) for a prompt replacement or refund. Unopened brewing equipment may be returned in original packaging within 30 days.",
    privacy:
      "Rostvyn collects only the information necessary to roast, fulfill, and support your order—including your name, delivery address, phone number, email address, and payment transfer reference (TrxID) when paying via manual bank transfer. We never sell or rent customer data to third parties. You may request access to or deletion of your personal data at any time by emailing concierge@rostvyn.com.",
    terms:
      "By placing an order with Rostvyn Roastery, you agree that all prices are displayed in the store's active currency and include applicable roastery handling. Manual bank transfer orders require a valid Transaction Reference (TrxID) and are confirmed upon verification by our operations team. Inventory is reserved at checkout and released if an unverified order is cancelled. All product descriptions, tasting notes, and brew guides are proprietary to Rostvyn.",
  };

  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: {
      policyTexts: policyTextsData,
    },
    create: {
      id: "default",
      storeName: "Rostvyn",
      currencyCode: "USD",
      freeShippingThreshold: 45.0,
      contactPhone: "+1 (415) 890-4421",
      contactEmail: "concierge@rostvyn.com",
      address: "418 Alder Street, Portland, OR 97204, United States",
      metroDeliveryFee: 5.0,
      nationalDeliveryFee: 12.0,
      announcementText:
        "Free Delivery on Orders Over $45 • Roasted Every Tuesday & Friday",
      paymentAccounts: [
        {
          label: "International Wire / SEPA (EUR & USD)",
          bankName: "Mercury Commercial Bank",
          accountName: "Rostvyn Roastery LLC",
          accountNumber: "DE89 3704 0044 0532 0130 00",
          routingOrSwift: "COBADEFFXXX",
          instructions:
            "Include your Order Reference (RV-...) in the transfer memo and submit your TrxID at checkout.",
        },
        {
          label: "Australia PayID / Fast Transfer",
          bankName: "Commonwealth Roastery Trust",
          accountName: "Rostvyn Specialty Coffee Pty Ltd",
          accountNumber: "payments@rostvyn.com",
          routingOrSwift: "BSB 062-000",
          instructions:
            "Use your Order Reference as the description and provide your receipt reference.",
        },
      ],
      heroData: {
        eyebrow: "SMALL-BATCH ARTISAN ROASTERY",
        headline: "Precision-Roasted Single Origins, Delivered at Peak Aromatics.",
        subheadline:
          "Sourced directly from high-altitude micro-lots across Ethiopia, Colombia, and Kenya. Roasted every Tuesday and Friday in Portland.",
        ctaLabel: "Shop Fresh Roasts",
        ctaHref: "/shop",
        imageUrl:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=85",
      },
      storyData: {
        title: "Crafted Between Science and Terroir",
        body: "Every lot at Rostvyn is profiled on cast-iron drum roasters, cupped blind by Q-Graders, and rested for optimal degassing before dispatch. We partner directly with smallholder washing stations at transparent farm-gate premiums.",
        roastDays: "Tuesday & Friday",
      },
      policyTexts: policyTextsData,
    },
  });

  // 3. Categories
  const categoryData = [
    {
      name: "Single Origin",
      slug: "single-origin",
      imageUrl:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80",
      sortOrder: 1,
    },
    {
      name: "Signature Blends",
      slug: "signature-blends",
      imageUrl:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80",
      sortOrder: 2,
    },
    {
      name: "Decaf & Low-Caf",
      slug: "decaf-low-caf",
      imageUrl:
        "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80",
      sortOrder: 3,
    },
    {
      name: "Brewing Gear",
      slug: "brewing-gear",
      imageUrl:
        "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=900&q=80",
      sortOrder: 4,
    },
    {
      name: "Tasting Bundles",
      slug: "bundles",
      imageUrl:
        "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=80",
      sortOrder: 5,
    },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: cat.sortOrder, imageUrl: cat.imageUrl },
      create: cat,
    });
    categories[cat.slug] = record.id;
  }

  // 4. Products & Variants
  const productsSeed = [
    {
      categorySlug: "single-origin",
      name: "Ethiopia Yirgacheffe Worka Sakaro",
      slug: "ethiopia-yirgacheffe-worka-sakaro",
      description:
        "Washed heirloom lot grown at 2,150m in Gedeb, Yirgacheffe. Delicate white jasmine aromatics unfold into bergamot tea, ripe white peach, and a crystalline cane-sugar finish.",
      roastLevel: RoastLevel.LIGHT,
      originNotes: "Jasmine • Bergamot • White Peach",
      basePrice: 24.0,
      comparePrice: 28.0,
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1000&q=85",
      ],
      variants: [
        { name: "250g Whole Bean", sku: "RV-ETH-250-WB", priceOverride: null, stockCount: 42 },
        { name: "250g Filter Grind", sku: "RV-ETH-250-FG", priceOverride: null, stockCount: 28 },
        { name: "500g Whole Bean", sku: "RV-ETH-500-WB", priceOverride: 44.0, stockCount: 18 },
      ],
    },
    {
      categorySlug: "single-origin",
      name: "Colombia Huila Pink Bourbon",
      slug: "colombia-huila-pink-bourbon",
      description:
        "Honey-processed micro-lot from Finca El Paraíso at 1,850m. Vibrant blood orange acidity balanced by silky caramel, red currant, and honeyed panela sweetness.",
      roastLevel: RoastLevel.LIGHT,
      originNotes: "Blood Orange • Red Currant • Panela",
      basePrice: 26.0,
      comparePrice: null,
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=1000&q=85",
      ],
      variants: [
        { name: "250g Whole Bean", sku: "RV-COL-250-WB", priceOverride: null, stockCount: 35 },
        { name: "250g Filter Grind", sku: "RV-COL-250-FG", priceOverride: null, stockCount: 20 },
        { name: "1kg Whole Bean", sku: "RV-COL-1KG-WB", priceOverride: 88.0, stockCount: 10 },
      ],
    },
    {
      categorySlug: "signature-blends",
      name: "Nocturne House Espresso",
      slug: "nocturne-house-espresso",
      description:
        "Our flagship espresso architecture combining natural Brazil Mogiana with washed Guatemala Huehuetenango. Syrupy crema with dark Valrhona chocolate, toasted hazelnut, and dried fig.",
      roastLevel: RoastLevel.MEDIUM,
      originNotes: "Dark Chocolate • Toasted Hazelnut • Dried Fig",
      basePrice: 21.0,
      comparePrice: null,
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1000&q=85",
      ],
      variants: [
        { name: "250g Whole Bean", sku: "RV-NOC-250-WB", priceOverride: null, stockCount: 65 },
        { name: "250g Espresso Grind", sku: "RV-NOC-250-EG", priceOverride: null, stockCount: 40 },
        { name: "1kg Whole Bean", sku: "RV-NOC-1KG-WB", priceOverride: 72.0, stockCount: 24 },
      ],
    },
    {
      categorySlug: "signature-blends",
      name: "Velvet Ember Dark Roast",
      slug: "velvet-ember-dark-roast",
      description:
        "Developed slowly past first crack for lovers of bold, structured cups without bitterness. Deep bittersweet cocoa, smoked cedar, and lingering molasses sweetness.",
      roastLevel: RoastLevel.DARK,
      originNotes: "Bittersweet Cocoa • Molasses • Cedar",
      basePrice: 20.0,
      comparePrice: 23.0,
      isFeatured: false,
      images: [
        "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?auto=format&fit=crop&w=1000&q=85",
      ],
      variants: [
        { name: "250g Whole Bean", sku: "RV-VEL-250-WB", priceOverride: null, stockCount: 50 },
        { name: "500g Whole Bean", sku: "RV-VEL-500-WB", priceOverride: 37.0, stockCount: 22 },
      ],
    },
    {
      categorySlug: "decaf-low-caf",
      name: "Cauca Sugarcane EA Decaf",
      slug: "cauca-sugarcane-ea-decaf",
      description:
        "Naturally decaffeinated in Colombia using fermented sugarcane ethyl acetate. Retains remarkable clarity with notes of milk chocolate, baked apple, and almond praline.",
      roastLevel: RoastLevel.MEDIUM,
      originNotes: "Milk Chocolate • Baked Apple • Almond",
      basePrice: 22.0,
      comparePrice: null,
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1000&q=85",
      ],
      variants: [
        { name: "250g Whole Bean", sku: "RV-DEC-250-WB", priceOverride: null, stockCount: 30 },
        { name: "250g Filter Grind", sku: "RV-DEC-250-FG", priceOverride: null, stockCount: 18 },
      ],
    },
    {
      categorySlug: "brewing-gear",
      name: "Rostvyn Ceramic Pour-Over Dripper 02",
      slug: "rostvyn-ceramic-pour-over-dripper-02",
      description:
        "Hand-glazed stoneware 60-degree conical dripper engineered for superior thermal stability and crisp, sediment-free extractions.",
      roastLevel: null,
      originNotes: "Stoneware • Matte Alabaster • 1–4 Cups",
      basePrice: 38.0,
      comparePrice: null,
      isFeatured: false,
      images: [
        "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1000&q=85",
      ],
      variants: [
        { name: "Matte Alabaster", sku: "RV-DRIP-02-ALB", priceOverride: null, stockCount: 16 },
        { name: "Charcoal Basalt", sku: "RV-DRIP-02-BSL", priceOverride: null, stockCount: 12 },
      ],
    },
    {
      categorySlug: "bundles",
      name: "Single-Origin Tasting Flight (3 × 250g)",
      slug: "single-origin-tasting-flight",
      description:
        "An editorial exploration of our seasonal micro-lots: Ethiopia Yirgacheffe Worka Sakaro, Colombia Huila Pink Bourbon, and Nocturne House Espresso, presented in our embossed tasting box with cupping cards.",
      roastLevel: RoastLevel.LIGHT,
      originNotes: "3 Seasonal Lots • Tasting Cards • Gift Box",
      basePrice: 60.0,
      comparePrice: 71.0,
      isFeatured: true,
      images: [
        "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1000&q=85",
      ],
      variants: [
        { name: "Whole Bean Flight (3 × 250g)", sku: "RV-BND-FLT-WB", priceOverride: null, stockCount: 25 },
        { name: "Filter Grind Flight (3 × 250g)", sku: "RV-BND-FLT-FG", priceOverride: null, stockCount: 14 },
        { name: "Espresso Grind Flight (3 × 250g)", sku: "RV-BND-FLT-EG", priceOverride: null, stockCount: 0 },
      ],
    },
    {
      categorySlug: "bundles",
      name: "The Pour-Over Ritual Gift Set",
      slug: "pour-over-ritual-gift-set",
      description:
        "Everything required for a tranquil morning ritual: our hand-glazed Ceramic Pour-Over Dripper 02 paired with 250g of Ethiopia Yirgacheffe and 250g of Colombia Huila Pink Bourbon.",
      roastLevel: RoastLevel.MEDIUM,
      originNotes: "Ceramic Dripper 02 • 2 × 250g Micro-Lots",
      basePrice: 74.0,
      comparePrice: 88.0,
      isFeatured: false,
      images: [
        "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=1000&q=85",
      ],
      variants: [
        { name: "Alabaster Dripper + Whole Bean", sku: "RV-BND-RIT-ALB-WB", priceOverride: null, stockCount: 12 },
        { name: "Alabaster Dripper + Filter Grind", sku: "RV-BND-RIT-ALB-FG", priceOverride: null, stockCount: 9 },
        { name: "Basalt Dripper + Whole Bean", sku: "RV-BND-RIT-BSL-WB", priceOverride: null, stockCount: 8 },
      ],
    },
  ];

  const createdProducts: Record<string, string> = {};

  for (const item of productsSeed) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        roastLevel: item.roastLevel,
        originNotes: item.originNotes,
        basePrice: item.basePrice,
        comparePrice: item.comparePrice,
        images: item.images,
        isFeatured: item.isFeatured,
      },
      create: {
        categoryId: categories[item.categorySlug],
        name: item.name,
        slug: item.slug,
        description: item.description,
        roastLevel: item.roastLevel,
        originNotes: item.originNotes,
        basePrice: item.basePrice,
        comparePrice: item.comparePrice,
        images: item.images,
        isFeatured: item.isFeatured,
        isActive: true,
      },
    });

    createdProducts[item.slug] = product.id;

    for (const v of item.variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          name: v.name,
          priceOverride: v.priceOverride,
        },
        create: {
          productId: product.id,
          name: v.name,
          sku: v.sku,
          priceOverride: v.priceOverride,
          stockCount: v.stockCount,
          isActive: true,
        },
      });
    }
  }

  // 5. Promo Codes
  await prisma.promoCode.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10.0,
      minOrderAmount: 20.0,
      maxUses: 500,
      isActive: true,
    },
  });

  await prisma.promoCode.upsert({
    where: { code: "ROAST5" },
    update: {},
    create: {
      code: "ROAST5",
      discountType: DiscountType.FIXED,
      discountValue: 5.0,
      minOrderAmount: 35.0,
      maxUses: 200,
      isActive: true,
    },
  });

  // 6. Featured Reviews (only insert if none exist yet so re-seeding stays idempotent)
  const existingReviews = await prisma.productReview.count();
  if (existingReviews === 0) {
    await prisma.productReview.createMany({
      data: [
        {
          productId: createdProducts["ethiopia-yirgacheffe-worka-sakaro"],
          authorName: "Claire M.",
          rating: 5,
          comment:
            "Extraordinary floral clarity on a V60. Easily rivals the best washed Ethiopian lots I have tasted in Melbourne and Copenhagen.",
          isVerifiedPurchase: true,
          status: ReviewStatus.APPROVED,
          isFeatured: true,
        },
        {
          productId: createdProducts["nocturne-house-espresso"],
          authorName: "Henrik L.",
          rating: 5,
          comment:
            "Dialed in effortlessly at 1:2 in 29 seconds. Rich chocolate body that shines both straight and in an oat cortado.",
          isVerifiedPurchase: true,
          status: ReviewStatus.APPROVED,
          isFeatured: true,
        },
        {
          productId: createdProducts["colombia-huila-pink-bourbon"],
          authorName: "Sienna R.",
          rating: 5,
          comment:
            "Juicy blood orange sweetness with zero astringency. Arrived two days after roasting with an unmistakable aroma.",
          isVerifiedPurchase: true,
          status: ReviewStatus.APPROVED,
          isFeatured: true,
        },
      ],
    });
  }

  console.log(
    `Seed complete. Super Admin ready: ${superAdmin.email} (password: RostvynAdmin@2026)`
  );
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
