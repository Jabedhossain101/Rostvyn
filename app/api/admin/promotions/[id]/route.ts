import { NextResponse } from "next/server";
import { DiscountType, Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const patchPromoSchema = z.object({
  code: z.string().trim().min(2).max(40).optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  discountValue: z.coerce.number().positive().optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = patchPromoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid promo update." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const promo = await prisma.promoCode.update({
      where: { id },
      data: {
        ...(d.code !== undefined ? { code: d.code.toUpperCase() } : {}),
        ...(d.discountType !== undefined
          ? { discountType: d.discountType as DiscountType }
          : {}),
        ...(d.discountValue !== undefined
          ? { discountValue: d.discountValue }
          : {}),
        ...(d.minOrderAmount !== undefined
          ? { minOrderAmount: d.minOrderAmount }
          : {}),
        ...(d.maxUses !== undefined ? { maxUses: d.maxUses } : {}),
        ...(d.expiresAt !== undefined
          ? { expiresAt: d.expiresAt ? new Date(d.expiresAt) : null }
          : {}),
        ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
      },
    });

    return NextResponse.json({ id: promo.id, isActive: promo.isActive });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A promo code with this code already exists." },
        { status: 409 }
      );
    }
    console.error("[PATCH /api/admin/promotions/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update promo code." },
      { status: 500 }
    );
  }
}
