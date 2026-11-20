import { redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  OrdersListClient,
  type AdminOrderRow,
} from "@/components/admin/OrdersListClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

  const [orders, settings] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        payment: { select: { method: true, status: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { currencyCode: true },
    }),
  ]);

  const rows: AdminOrderRow[] = orders.map((o) => ({
    id: o.id,
    orderRef: o.orderRef,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    city: o.city,
    totalAmount: Number(o.totalAmount),
    fulfillmentStatus: o.fulfillmentStatus,
    paymentMethod: o.payment?.method ?? null,
    paymentStatus: o.payment?.status ?? null,
    itemCount: o._count.items,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <OrdersListClient
      initialOrders={rows}
      currencyCode={settings?.currencyCode ?? "USD"}
    />
  );
}
