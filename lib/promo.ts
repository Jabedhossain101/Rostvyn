import { DiscountType } from "@prisma/client";

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePromoDiscount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number
): number {
  if (subtotal <= 0 || discountValue <= 0) return 0;

  const rawDiscount =
    discountType === DiscountType.PERCENTAGE
      ? (subtotal * discountValue) / 100
      : discountValue;

  return roundMoney(Math.min(subtotal, Math.max(0, rawDiscount)));
}
