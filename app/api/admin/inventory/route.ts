import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const adjustStockSchema = z
  .object({
    variantId: z.string().trim().min(1, "Variant ID is required."),
    quantityDelta: z.coerce.number().int().optional(),
    newStock: z.coerce.number().int().min(0).optional(),
    reason: z
      .string()
      .trim()
      .min(3, "A mandatory audit reason (at least 3 characters) is required.")
      .max(240),
  })
  .refine(
    (d) => d.quantityDelta !== undefined || d.newStock !== undefined,
    "Provide either quantityDelta or newStock."
  );

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const sp = request.nextUrl.searchParams;
    const filter = sp.get("filter"); // "lowStock" | "outOfStock"

    const where: Prisma.ProductVariantWhereInput = {};
    if (filter === "lowStock") {
      where.stockCount = { gt: 0, lte: 5 };
    } else if (filter === "outOfStock") {
      where.stockCount = 0;
    }

    const [variants, logs] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        orderBy: [{ stockCount: "asc" }, { updatedAt: "desc" }],
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
              category: { select: { name: true } },
            },
          },
        },
      }),
      prisma.inventoryLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 40,
        include: {
          variant: {
            select: {
              name: true,
              sku: true,
              product: { select: { name: true } },
            },
          },
          admin: { select: { name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      variants: variants.map((v) => ({
        id: v.id,
        productId: v.productId,
        productName: v.product.name,
        categoryName: v.product.category.name,
        productActive: v.product.isActive,
        name: v.name,
        sku: v.sku,
        stockCount: v.stockCount,
        isActive: v.isActive,
        updatedAt: v.updatedAt.toISOString(),
      })),
      logs: logs.map((l) => ({
        id: l.id,
        sku: l.variant.sku,
        productName: l.variant.product.name,
        variantName: l.variant.name,
        quantityDelta: l.quantityDelta,
        previousStock: l.previousStock,
        newStock: l.newStock,
        reason: l.reason,
        adminName: l.admin?.name ?? "System / Guest Checkout",
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/inventory]", error);
    return NextResponse.json(
      { error: "Failed to load inventory data." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { admin, errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = adjustStockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid stock adjustment." },
        { status: 400 }
      );
    }

    const { variantId, quantityDelta, newStock, reason } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant) {
        return { error: "Variant not found.", status: 404 as const };
      }

      const targetStock =
        newStock !== undefined
          ? newStock
          : variant.stockCount + (quantityDelta ?? 0);

      if (targetStock < 0) {
        return {
          error: "Stock count cannot drop below 0.",
          status: 400 as const,
        };
      }

      const delta = targetStock - variant.stockCount;

      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: { stockCount: targetStock },
      });

      const log = await tx.inventoryLog.create({
        data: {
          variantId,
          quantityDelta: delta,
          previousStock: variant.stockCount,
          newStock: targetStock,
          reason,
          adminId: admin.id,
        },
      });

      return { variant: updated, log };
    }, { maxWait: 10000, timeout: 15000 });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      variantId: result.variant.id,
      stockCount: result.variant.stockCount,
      logId: result.log.id,
    });
  } catch (error) {
    console.error("[PATCH /api/admin/inventory]", error);
    return NextResponse.json(
      { error: "Failed to adjust stock." },
      { status: 500 }
    );
  }
}
