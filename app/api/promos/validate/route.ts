import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculatePromoDiscount } from "@/lib/promo";

const validatePromoSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Please enter a promo code.")
    .max(50, "Promo code is too long."),
  subtotal: z.coerce
    .number()
    .min(0, "Subtotal must be a valid non-negative amount."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = validatePromoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          valid: false,
          error: parsed.error.issues[0]?.message ?? "Invalid promo code request.",
        },
        { status: 400 }
      );
    }

    const normalizedCode = parsed.data.code.toUpperCase();
    const subtotal = parsed.data.subtotal;

    const promo = await prisma.promoCode.findUnique({
      where: { code: normalizedCode },
    });

    if (!promo || !promo.isActive) {
      return NextResponse.json(
        { valid: false, error: "This promo code is invalid or no longer active." },
        { status: 400 }
      );
    }

    if (promo.expiresAt && promo.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { valid: false, error: "This promo code has expired." },
        { status: 400 }
      );
    }

    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return NextResponse.json(
        {
          valid: false,
          error: "This promo code has reached its maximum redemption limit.",
        },
        { status: 400 }
      );
    }

    const minOrderAmount = Number(promo.minOrderAmount);
    if (subtotal < minOrderAmount) {
      return NextResponse.json(
        {
          valid: false,
          error: `A minimum subtotal of ${minOrderAmount.toFixed(2)} is required to use code ${promo.code}.`,
        },
        { status: 400 }
      );
    }

    const discountValue = Number(promo.discountValue);
    const discountAmount = calculatePromoDiscount(
      subtotal,
      promo.discountType,
      discountValue
    );

    return NextResponse.json({
      valid: true,
      code: promo.code,
      discountType: promo.discountType,
      discountValue,
      discountAmount,
    });
  } catch (error) {
    console.error("[POST /api/promos/validate]", error);
    return NextResponse.json(
      { valid: false, error: "Unable to validate promo code right now." },
      { status: 500 }
    );
  }
}
