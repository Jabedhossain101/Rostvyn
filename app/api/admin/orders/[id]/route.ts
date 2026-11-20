import { NextResponse } from "next/server";
import { FulfillmentStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const patchOrderSchema = z.object({
  fulfillmentStatus: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ])
    .optional(),
  internalNotes: z.string().trim().max(2000).nullable().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: {
          include: {
            verifiedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderRef: order.orderRef,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        city: order.city,
        address: order.address,
        notes: order.notes,
        internalNotes: order.internalNotes,
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        promoCodeUsed: order.promoCodeUsed,
        deliveryFee: Number(order.deliveryFee),
        totalAmount: Number(order.totalAmount),
        fulfillmentStatus: order.fulfillmentStatus,
        stockRestored: order.stockRestored,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productNameSnapshot: item.productNameSnapshot,
          variantSnapshot: item.variantSnapshot,
          skuSnapshot: item.skuSnapshot,
          unitPriceSnapshot: Number(item.unitPriceSnapshot),
          quantity: item.quantity,
        })),
        payment: order.payment
          ? {
              id: order.payment.id,
              method: order.payment.method,
              status: order.payment.status,
              amount: Number(order.payment.amount),
              trxId: order.payment.trxId,
              senderAccount: order.payment.senderAccount,
              auditNote: order.payment.auditNote,
              verifiedAt: order.payment.verifiedAt?.toISOString() ?? null,
              verifiedBy: order.payment.verifiedBy,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[GET /api/admin/orders/[id]]", error);
    return NextResponse.json(
      { error: "Failed to load order details." },
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
    const parsed = patchOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid order update." },
        { status: 400 }
      );
    }

    const { fulfillmentStatus, internalNotes } = parsed.data;

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existing) return null;

      let shouldRestoreStock = false;

      // CRITICAL ACID Rule: restore stock EXACTLY ONCE when transitioning to CANCELLED
      if (
        fulfillmentStatus === FulfillmentStatus.CANCELLED &&
        !existing.stockRestored
      ) {
        // Atomic guard using updateMany so concurrent cancel requests cannot double-restore
        const guard = await tx.order.updateMany({
          where: { id, stockRestored: false },
          data: {
            fulfillmentStatus: FulfillmentStatus.CANCELLED,
            stockRestored: true,
            ...(internalNotes !== undefined ? { internalNotes } : {}),
          },
        });

        if (guard.count === 1) {
          shouldRestoreStock = true;
          for (const item of existing.items) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { id: true, stockCount: true },
            });
            if (variant) {
              const previousStock = variant.stockCount;
              const newStock = previousStock + item.quantity;
              await tx.productVariant.update({
                where: { id: variant.id },
                data: { stockCount: { increment: item.quantity } },
              });
              await tx.inventoryLog.create({
                data: {
                  variantId: variant.id,
                  quantityDelta: item.quantity,
                  previousStock,
                  newStock,
                  reason: `Order cancelled: ${existing.orderRef}`,
                  adminId: admin.id,
                },
              });
            }
          }
        }
      } else {
        await tx.order.update({
          where: { id },
          data: {
            ...(fulfillmentStatus !== undefined
              ? { fulfillmentStatus: fulfillmentStatus as FulfillmentStatus }
              : {}),
            ...(internalNotes !== undefined ? { internalNotes } : {}),
          },
        });
      }

      const fresh = await tx.order.findUnique({ where: { id } });
      return { order: fresh, stockRestoredNow: shouldRestoreStock };
    });

    if (!updated || !updated.order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.order.id,
      fulfillmentStatus: updated.order.fulfillmentStatus,
      stockRestored: updated.order.stockRestored,
      stockRestoredNow: updated.stockRestoredNow,
      internalNotes: updated.order.internalNotes,
    });
  } catch (error) {
    console.error("[PATCH /api/admin/orders/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update order." },
      { status: 500 }
    );
  }
}
