import { NextResponse } from "next/server";
import { DiscountType, Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const createPromoSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Promo code must be at least 2 characters.")
    .max(40),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.coerce.number().positive("Discount value must be positive."),
  minOrderAmount: z.coerce.number().min(0).default(0),
  maxUses: z.coerce.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      promos: promos.map((p) => ({
        id: p.id,
        code: p.code,
        discountType: p.discountType,
        discountValue: Number(p.discountValue),
        minOrderAmount: Number(p.minOrderAmount),
        maxUses: p.maxUses,
        usedCount: p.usedCount,
        expiresAt: p.expiresAt?.toISOString() ?? null,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/promotions]", error);
    return NextResponse.json(
      { error: "Failed to load promo codes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = createPromoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid promo code." },
        { status: 400 }
      );
    }

    const d = parsed.data;
    const promo = await prisma.promoCode.create({
      data: {
        code: d.code.toUpperCase(),
        discountType: d.discountType as DiscountType,
        discountValue: d.discountValue,
        minOrderAmount: d.minOrderAmount,
        maxUses: d.maxUses ?? null,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        isActive: d.isActive,
      },
    });

    return NextResponse.json({ id: promo.id, code: promo.code }, { status: 201 });
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
    console.error("[POST /api/admin/promotions]", error);
    return NextResponse.json(
      { error: "Failed to create promo code." },
      { status: 500 }
    );
  }
}
