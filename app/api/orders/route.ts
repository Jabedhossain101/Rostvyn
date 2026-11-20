import { NextResponse } from "next/server";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculatePromoDiscount, roundMoney } from "@/lib/promo";
import { generateOrderRef } from "@/lib/utils";

const orderItemInputSchema = z.object({
  variantId: z.string().trim().min(1, "Variant ID is required."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(99, "Maximum 99 units per line item."),
});

const createOrderSchema = z
  .object({
    customerName: z
      .string()
      .trim()
      .min(2, "Please enter your full name.")
      .max(120),
    customerPhone: z
      .string()
      .trim()
      .min(6, "Please enter a valid mobile or phone number.")
      .max(40),
    customerEmail: z
      .string()
      .trim()
      .email("Please enter a valid email address.")
      .optional()
      .or(z.literal("")),
    city: z.string().trim().min(2, "Please enter your city or region.").max(100),
    deliveryZone: z.enum(["METRO", "NATIONAL"]),
    address: z
      .string()
      .trim()
      .min(6, "Please enter your full delivery address.")
      .max(500),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
    items: z
      .array(orderItemInputSchema)
      .min(1, "Your cart is empty. Add at least one item to checkout."),
    promoCode: z.string().trim().max(50).optional().or(z.literal("")),
    paymentMethod: z.enum(["COD", "MANUAL_TRANSFER", "MFS"]),
    trxId: z.string().trim().max(120).optional().or(z.literal("")),
    senderAccount: z.string().trim().max(140).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (
      data.paymentMethod === "MANUAL_TRANSFER" ||
      data.paymentMethod === "MFS"
    ) {
      if (!data.trxId || data.trxId.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["trxId"],
          message:
            "Transaction Reference (TrxID) is required for bank/manual transfers.",
        });
      }
      if (!data.senderAccount || data.senderAccount.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["senderAccount"],
          message:
            "Sender account name or identifier is required for bank/manual transfers.",
        });
      }
    }
  });

class OrderHttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Please check your checkout details.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Consolidate duplicate variantIds cleanly
    const mergedMap = new Map<string, number>();
    for (const item of input.items) {
      mergedMap.set(
        item.variantId,
        (mergedMap.get(item.variantId) ?? 0) + item.quantity
      );
    }
    const normalizedItems = Array.from(mergedMap.entries()).map(
      ([variantId, quantity]) => ({ variantId, quantity })
    );

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch StoreSettings
      const settings = await tx.storeSettings.findUnique({
        where: { id: "default" },
      });

      const metroFee = settings ? Number(settings.metroDeliveryFee) : 5;
      const nationalFee = settings ? Number(settings.nationalDeliveryFee) : 12;
      const freeShippingThreshold = settings
        ? Number(settings.freeShippingThreshold)
        : 45;

      // 2. Fetch all requested variants + parent products
      const variantIds = normalizedItems.map((i) => i.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      });

      const variantById = new Map(variants.map((v) => [v.id, v]));

      // Verify all variants & parent products exist and are active
      for (const reqItem of normalizedItems) {
        const variant = variantById.get(reqItem.variantId);
        if (!variant || !variant.isActive || !variant.product.isActive) {
          throw new OrderHttpError(
            "One or more items in your bag are no longer available. Please refresh your cart.",
            400
          );
        }
      }

      // 3. Recalculate authoritative unit prices & subtotal
      let subtotal = 0;
      const lineSnapshots = normalizedItems.map((reqItem) => {
        const variant = variantById.get(reqItem.variantId)!;
        const unitPrice = roundMoney(
          variant.priceOverride !== null
            ? Number(variant.priceOverride)
            : Number(variant.product.basePrice)
        );
        subtotal = roundMoney(subtotal + unitPrice * reqItem.quantity);
        return {
          productId: variant.productId,
          variantId: variant.id,
          productNameSnapshot: variant.product.name,
          variantSnapshot: variant.name,
          skuSnapshot: variant.sku,
          unitPriceSnapshot: unitPrice,
          quantity: reqItem.quantity,
          previousStock: variant.stockCount,
        };
      });

      // 4. Generate unique orderRef
      let orderRef = generateOrderRef();
      for (let attempt = 0; attempt < 5; attempt++) {
        const exists = await tx.order.findUnique({
          where: { orderRef },
          select: { id: true },
        });
        if (!exists) break;
        orderRef = generateOrderRef();
      }

      // 5. Atomic row-level conditional stock deduction & InventoryLog
      for (const line of lineSnapshots) {
        const updated = await tx.productVariant.updateMany({
          where: {
            id: line.variantId,
            stockCount: { gte: line.quantity },
          },
          data: {
            stockCount: { decrement: line.quantity },
          },
        });

        if (updated.count === 0) {
          throw new OrderHttpError(
            `Insufficient stock for ${line.productNameSnapshot} (${line.variantSnapshot}).`,
            409
          );
        }

        await tx.inventoryLog.create({
          data: {
            variantId: line.variantId,
            quantityDelta: -line.quantity,
            previousStock: line.previousStock,
            newStock: line.previousStock - line.quantity,
            reason: `Order placement: ${orderRef}`,
          },
        });
      }

      // 6. Server-side PromoCode re-validation & atomic usedCount increment
      let discountAmount = 0;
      let promoCodeUsed: string | null = null;

      if (input.promoCode && input.promoCode.trim().length > 0) {
        const normalizedCode = input.promoCode.trim().toUpperCase();
        const promo = await tx.promoCode.findUnique({
          where: { code: normalizedCode },
        });

        if (!promo || !promo.isActive) {
          throw new OrderHttpError(
            "The applied promo code is invalid or inactive.",
            400
          );
        }
        if (promo.expiresAt && promo.expiresAt.getTime() <= Date.now()) {
          throw new OrderHttpError("The applied promo code has expired.", 400);
        }
        const minOrderAmount = Number(promo.minOrderAmount);
        if (subtotal < minOrderAmount) {
          throw new OrderHttpError(
            `Promo code ${promo.code} requires a minimum order of ${minOrderAmount.toFixed(2)}.`,
            400
          );
        }

        const promoUpdate = await tx.promoCode.updateMany({
          where:
            promo.maxUses !== null
              ? { id: promo.id, isActive: true, usedCount: { lt: promo.maxUses } }
              : { id: promo.id, isActive: true },
          data: { usedCount: { increment: 1 } },
        });

        if (promoUpdate.count === 0) {
          throw new OrderHttpError(
            "This promo code has reached its redemption limit.",
            400
          );
        }

        discountAmount = calculatePromoDiscount(
          subtotal,
          promo.discountType,
          Number(promo.discountValue)
        );
        promoCodeUsed = promo.code;
      }

      // 7. Compute delivery fee & grand total
      const netAfterDiscount = roundMoney(subtotal - discountAmount);
      const deliveryFee =
        netAfterDiscount >= freeShippingThreshold
          ? 0
          : input.deliveryZone === "METRO"
          ? metroFee
          : nationalFee;

      const totalAmount = roundMoney(netAfterDiscount + deliveryFee);

      // 8. Create Order, immutable OrderItem snapshots, and Payment
      const order = await tx.order.create({
        data: {
          orderRef,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          customerEmail: input.customerEmail ? input.customerEmail : null,
          city: input.city,
          address: input.address,
          notes: input.notes ? input.notes : null,
          subtotal,
          discountAmount,
          promoCodeUsed,
          deliveryFee,
          totalAmount,
          items: {
            create: lineSnapshots.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              productNameSnapshot: line.productNameSnapshot,
              variantSnapshot: line.variantSnapshot,
              skuSnapshot: line.skuSnapshot,
              unitPriceSnapshot: line.unitPriceSnapshot,
              quantity: line.quantity,
            })),
          },
          payment: {
            create: {
              method: input.paymentMethod as PaymentMethod,
              status: PaymentStatus.PENDING_VERIFICATION,
              amount: totalAmount,
              trxId:
                input.paymentMethod === "COD"
                  ? null
                  : input.trxId?.trim() || null,
              senderAccount:
                input.paymentMethod === "COD"
                  ? null
                  : input.senderAccount?.trim() || null,
            },
          },
        },
        select: {
          orderRef: true,
          totalAmount: true,
        },
      });

      return {
        orderRef: order.orderRef,
        totalAmount: Number(order.totalAmount),
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof OrderHttpError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("[POST /api/orders]", error);
    return NextResponse.json(
      { error: "Unable to place your order right now. Please try again." },
      { status: 500 }
    );
  }
}
