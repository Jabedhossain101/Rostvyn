import { NextResponse } from "next/server";
import { FulfillmentStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const [
      revenueAgg,
      totalOrders,
      pendingOrders,
      activeProducts,
      lowStockCount,
      pendingManualPaymentsCount,
      recentOrders,
      paymentAuditQueue,
      settings,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { fulfillmentStatus: { not: FulfillmentStatus.CANCELLED } },
        _sum: { totalAmount: true },
      }),
      prisma.order.count(),
      prisma.order.count({
        where: { fulfillmentStatus: FulfillmentStatus.PENDING },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.productVariant.count({
        where: { isActive: true, stockCount: { lte: 5 } },
      }),
      prisma.payment.count({
        where: {
          status: PaymentStatus.PENDING_VERIFICATION,
          method: { in: [PaymentMethod.MANUAL_TRANSFER, PaymentMethod.MFS] },
        },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          payment: { select: { method: true, status: true, trxId: true } },
        },
      }),
      prisma.payment.findMany({
        where: { status: PaymentStatus.PENDING_VERIFICATION },
        orderBy: { createdAt: "asc" },
        take: 6,
        include: {
          order: {
            select: {
              id: true,
              orderRef: true,
              customerName: true,
              customerPhone: true,
            },
          },
        },
      }),
      prisma.storeSettings.findUnique({
        where: { id: "default" },
        select: { currencyCode: true },
      }),
    ]);

    return NextResponse.json({
      currencyCode: settings?.currencyCode ?? "USD",
      kpis: {
        totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
        totalOrders,
        pendingOrders,
        activeProducts,
        lowStockCount,
        pendingManualPaymentsCount,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderRef: o.orderRef,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        totalAmount: Number(o.totalAmount),
        fulfillmentStatus: o.fulfillmentStatus,
        paymentStatus: o.payment?.status ?? null,
        paymentMethod: o.payment?.method ?? null,
        createdAt: o.createdAt.toISOString(),
      })),
      paymentAuditQueue: paymentAuditQueue.map((p) => ({
        id: p.id,
        orderId: p.order.id,
        orderRef: p.order.orderRef,
        customerName: p.order.customerName,
        method: p.method,
        status: p.status,
        amount: Number(p.amount),
        trxId: p.trxId,
        senderAccount: p.senderAccount,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/dashboard]", error);
    return NextResponse.json(
      { error: "Failed to load dashboard metrics." },
      { status: 500 }
    );
  }
}
