import { NextResponse, type NextRequest } from "next/server";
import { PaymentStatus, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const sp = request.nextUrl.searchParams;
    const status = sp.get("status")?.toUpperCase();
    const q = sp.get("q")?.trim();

    const where: Prisma.PaymentWhereInput = {};
    if (
      status &&
      Object.values(PaymentStatus).includes(status as PaymentStatus)
    ) {
      where.status = status as PaymentStatus;
    }

    if (q) {
      where.OR = [
        { trxId: { contains: q, mode: "insensitive" } },
        { senderAccount: { contains: q, mode: "insensitive" } },
        { order: { orderRef: { contains: q, mode: "insensitive" } } },
        { order: { customerName: { contains: q, mode: "insensitive" } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        order: {
          select: {
            id: true,
            orderRef: true,
            customerName: true,
            customerPhone: true,
            fulfillmentStatus: true,
          },
        },
        verifiedBy: { select: { name: true } },
      },
    });

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        orderId: p.order.id,
        orderRef: p.order.orderRef,
        customerName: p.order.customerName,
        customerPhone: p.order.customerPhone,
        fulfillmentStatus: p.order.fulfillmentStatus,
        method: p.method,
        status: p.status,
        amount: Number(p.amount),
        trxId: p.trxId,
        senderAccount: p.senderAccount,
        auditNote: p.auditNote,
        verifiedByName: p.verifiedBy?.name ?? null,
        verifiedAt: p.verifiedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/payments]", error);
    return NextResponse.json(
      { error: "Failed to load payments." },
      { status: 500 }
    );
  }
}
