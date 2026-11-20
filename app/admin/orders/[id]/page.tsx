import { notFound, redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  OrderDetailClient,
  type AdminOrderDetail,
} from "@/components/admin/OrderDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: { include: { verifiedBy: { select: { name: true } } } },
      },
    }),
    prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { currencyCode: true },
    }),
  ]);

  if (!order) notFound();

  const serialized: AdminOrderDetail = {
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
    items: order.items.map((item) => ({
      id: item.id,
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
          verifiedByName: order.payment.verifiedBy?.name ?? null,
        }
      : null,
  };

  return (
    <OrderDetailClient
      order={serialized}
      currencyCode={settings?.currencyCode ?? "USD"}
    />
  );
}
