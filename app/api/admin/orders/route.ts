import { NextResponse, type NextRequest } from "next/server";
import { FulfillmentStatus, PaymentStatus, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const sp = request.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const fulfillmentStatus = sp.get("fulfillmentStatus")?.toUpperCase();
    const paymentStatus = sp.get("paymentStatus")?.toUpperCase();

    const where: Prisma.OrderWhereInput = {};
    if (q) {
      where.OR = [
        { orderRef: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q, mode: "insensitive" } },
      ];
    }

    if (
      fulfillmentStatus &&
      Object.values(FulfillmentStatus).includes(
        fulfillmentStatus as FulfillmentStatus
      )
    ) {
      where.fulfillmentStatus = fulfillmentStatus as FulfillmentStatus;
    }

    if (
      paymentStatus &&
      Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)
    ) {
      where.payment = { status: paymentStatus as PaymentStatus };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        payment: {
          select: { id: true, method: true, status: true, trxId: true },
        },
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        orderRef: o.orderRef,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        city: o.city,
        totalAmount: Number(o.totalAmount),
        fulfillmentStatus: o.fulfillmentStatus,
        stockRestored: o.stockRestored,
        itemCount: o._count.items,
        payment: o.payment,
        createdAt: o.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/orders]", error);
    return NextResponse.json(
      { error: "Failed to load orders." },
      { status: 500 }
    );
  }
}
