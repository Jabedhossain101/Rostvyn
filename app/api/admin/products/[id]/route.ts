import { NextResponse } from "next/server";
import { Prisma, RoastLevel } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const variantPatchSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().min(2).max(64),
  priceOverride: z.coerce.number().min(0).nullable().optional(),
  stockCount: z.coerce.number().int().min(0),
  isActive: z.boolean().default(true),
});

const patchProductSchema = z.object({
  categoryId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug must use lowercase letters, numbers, and hyphens.")
    .optional(),
  description: z.string().trim().min(10).optional(),
  roastLevel: z.enum(["LIGHT", "MEDIUM", "DARK"]).nullable().optional(),
  originNotes: z.string().trim().max(240).nullable().optional(),
  basePrice: z.coerce.number().min(0.01).optional(),
  comparePrice: z.coerce.number().min(0).nullable().optional(),
  images: z.array(z.string().trim().url()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  variants: z.array(variantPatchSchema).min(1).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        id: product.id,
        categoryId: product.categoryId,
        category: product.category,
        name: product.name,
        slug: product.slug,
        description: product.description,
        roastLevel: product.roastLevel,
        originNotes: product.originNotes,
        basePrice: Number(product.basePrice),
        comparePrice:
          product.comparePrice !== null ? Number(product.comparePrice) : null,
        images: product.images,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        variants: product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          priceOverride:
            v.priceOverride !== null ? Number(v.priceOverride) : null,
          stockCount: v.stockCount,
          isActive: v.isActive,
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/products/[id]]", error);
    return NextResponse.json(
      { error: "Failed to load product." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { admin, errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = patchProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid product update." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        where: { id },
        include: { variants: true },
      });

      if (!existing) return null;

      await tx.product.update({
        where: { id },
        data: {
          ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.slug !== undefined ? { slug: data.slug } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
          ...(data.roastLevel !== undefined
            ? { roastLevel: data.roastLevel as RoastLevel | null }
            : {}),
          ...(data.originNotes !== undefined
            ? { originNotes: data.originNotes }
            : {}),
          ...(data.basePrice !== undefined ? { basePrice: data.basePrice } : {}),
          ...(data.comparePrice !== undefined
            ? { comparePrice: data.comparePrice }
            : {}),
          ...(data.images !== undefined ? { images: data.images } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          ...(data.isFeatured !== undefined
            ? { isFeatured: data.isFeatured }
            : {}),
        },
      });

      if (data.variants) {
        const existingById = new Map(existing.variants.map((v) => [v.id, v]));

        for (const v of data.variants) {
          if (v.id && existingById.has(v.id)) {
            const prev = existingById.get(v.id)!;
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                name: v.name,
                sku: v.sku.toUpperCase(),
                priceOverride:
                  v.priceOverride !== undefined ? v.priceOverride : null,
                stockCount: v.stockCount,
                isActive: v.isActive,
              },
            });

            if (prev.stockCount !== v.stockCount) {
              await tx.inventoryLog.create({
                data: {
                  variantId: v.id,
                  quantityDelta: v.stockCount - prev.stockCount,
                  previousStock: prev.stockCount,
                  newStock: v.stockCount,
                  reason: "Product editor stock update",
                  adminId: admin.id,
                },
              });
            }
          } else {
            const createdVariant = await tx.productVariant.create({
              data: {
                productId: id,
                name: v.name,
                sku: v.sku.toUpperCase(),
                priceOverride:
                  v.priceOverride !== undefined ? v.priceOverride : null,
                stockCount: v.stockCount,
                isActive: v.isActive,
              },
            });
            if (createdVariant.stockCount > 0) {
              await tx.inventoryLog.create({
                data: {
                  variantId: createdVariant.id,
                  quantityDelta: createdVariant.stockCount,
                  previousStock: 0,
                  newStock: createdVariant.stockCount,
                  reason: "New variant added in product editor",
                  adminId: admin.id,
                },
              });
            }
          }
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: { variants: { orderBy: { createdAt: "asc" } } },
      });
    }, { maxWait: 10000, timeout: 15000 });

    if (!updated) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ id: updated.id, isActive: updated.isActive });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Slug or SKU already exists on another record." },
        { status: 409 }
      );
    }
    console.error("[PATCH /api/admin/products/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update product." },
      { status: 500 }
    );
  }
}
