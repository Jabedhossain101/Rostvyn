import { NextResponse, type NextRequest } from "next/server";
import { Prisma, RoastLevel } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const variantInputSchema = z.object({
  name: z.string().trim().min(1, "Variant name is required.").max(120),
  sku: z.string().trim().min(2, "SKU is required.").max(64),
  priceOverride: z.coerce.number().min(0).nullable().optional(),
  stockCount: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const createProductSchema = z.object({
  categoryId: z.string().trim().min(1, "Category is required."),
  name: z.string().trim().min(2, "Product name is required.").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug must use lowercase letters, numbers, and hyphens."),
  description: z.string().trim().min(10, "Description is required."),
  roastLevel: z.enum(["LIGHT", "MEDIUM", "DARK"]).nullable().optional(),
  originNotes: z.string().trim().max(240).nullable().optional(),
  basePrice: z.coerce.number().min(0.01, "Base price must be greater than 0."),
  comparePrice: z.coerce.number().min(0).nullable().optional(),
  images: z.array(z.string().trim().url("Image must be a valid URL.")).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  variants: z
    .array(variantInputSchema)
    .min(1, "At least one product variant is required."),
});

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const sp = request.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const categoryId = sp.get("categoryId")?.trim();
    const status = sp.get("status"); // "active" | "inactive"

    const where: Prisma.ProductWhereInput = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
        { variants: { some: { sku: { contains: q, mode: "insensitive" } } } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (status === "active") where.isActive = true;
    if (status === "inactive") where.isActive = false;

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        categoryId: p.categoryId,
        category: p.category,
        name: p.name,
        slug: p.slug,
        description: p.description,
        roastLevel: p.roastLevel,
        originNotes: p.originNotes,
        basePrice: Number(p.basePrice),
        comparePrice: p.comparePrice !== null ? Number(p.comparePrice) : null,
        images: p.images,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        createdAt: p.createdAt.toISOString(),
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          priceOverride: v.priceOverride !== null ? Number(v.priceOverride) : null,
          stockCount: v.stockCount,
          isActive: v.isActive,
        })),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/products]", error);
    return NextResponse.json(
      { error: "Failed to load products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { admin, errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid product data." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          categoryId: data.categoryId,
          name: data.name,
          slug: data.slug,
          description: data.description,
          roastLevel: (data.roastLevel as RoastLevel | null) ?? null,
          originNotes: data.originNotes || null,
          basePrice: data.basePrice,
          comparePrice:
            data.comparePrice !== undefined && data.comparePrice !== null
              ? data.comparePrice
              : null,
          images: data.images,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          variants: {
            create: data.variants.map((v) => ({
              name: v.name,
              sku: v.sku.toUpperCase(),
              priceOverride:
                v.priceOverride !== undefined && v.priceOverride !== null
                  ? v.priceOverride
                  : null,
              stockCount: v.stockCount,
              isActive: v.isActive,
            })),
          },
        },
        include: { variants: true },
      });

      // Record initial inventory audit logs for variants with starting stock
      for (const variant of created.variants) {
        if (variant.stockCount > 0) {
          await tx.inventoryLog.create({
            data: {
              variantId: variant.id,
              quantityDelta: variant.stockCount,
              previousStock: 0,
              newStock: variant.stockCount,
              reason: "Initial catalog stock",
              adminId: admin.id,
            },
          });
        }
      }

      return created;
    });

    return NextResponse.json({ id: product.id, slug: product.slug }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A product with this slug or a variant with this SKU already exists." },
        { status: 409 }
      );
    }
    console.error("[POST /api/admin/products]", error);
    return NextResponse.json(
      { error: "Failed to create product." },
      { status: 500 }
    );
  }
}
