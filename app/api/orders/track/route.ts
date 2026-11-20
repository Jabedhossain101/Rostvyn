import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const trackQuerySchema = z.object({
  ref: z.string().trim().min(1, "Order reference is required.").max(40),
  phone: z.string().trim().min(4, "Phone number is required.").max(40),
});

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const parsed = trackQuerySchema.safeParse({
      ref: sp.get("ref") ?? "",
      phone: sp.get("phone") ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Both order reference and phone number are required.",
        },
        { status: 400 }
      );
    }

    const orderRef = parsed.data.ref.toUpperCase();
    const customerPhone = parsed.data.phone;

    const order = await prisma.order.findFirst({
      where: {
        orderRef,
        customerPhone,
      },
      include: {
        items: true,
        payment: true,
      },
    });

    // Privacy-safe: never leak whether orderRef exists without matching phone
    if (!order) {
      return NextResponse.json(
        {
          error: "No order found matching that reference and phone number.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        orderRef: order.orderRef,
        createdAt: order.createdAt.toISOString(),
        fulfillmentStatus: order.fulfillmentStatus,
        city: order.city,
        address: order.address,
        subtotal: Number(order.subtotal),
        discountAmount: Number(order.discountAmount),
        promoCodeUsed: order.promoCodeUsed,
        deliveryFee: Number(order.deliveryFee),
        totalAmount: Number(order.totalAmount),
        payment: order.payment
          ? {
              method: order.payment.method,
              status: order.payment.status,
              trxId: order.payment.trxId,
              verifiedAt: order.payment.verifiedAt
                ? order.payment.verifiedAt.toISOString()
                : null,
            }
          : null,
        items: order.items.map((item) => ({
          id: item.id,
          productNameSnapshot: item.productNameSnapshot,
          variantSnapshot: item.variantSnapshot,
          skuSnapshot: item.skuSnapshot,
          unitPriceSnapshot: Number(item.unitPriceSnapshot),
          quantity: item.quantity,
        })),
      },
    });
  } catch (error) {
    console.error("[GET /api/orders/track]", error);
    return NextResponse.json(
      { error: "Unable to look up order right now." },
      { status: 500 }
    );
  }
}
