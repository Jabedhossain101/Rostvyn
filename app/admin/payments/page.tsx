import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  PaymentsListClient,
  type AdminPaymentRow,
} from "@/components/admin/PaymentsListClient";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

  const [payments, settings] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        order: { select: { id: true, orderRef: true, customerName: true } },
        verifiedBy: { select: { name: true } },
      },
    }),
    prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { currencyCode: true },
    }),
  ]);

  const rows: AdminPaymentRow[] = payments.map((p) => ({
    id: p.id,
    orderId: p.order.id,
    orderRef: p.order.orderRef,
    customerName: p.order.customerName,
    method: p.method,
    status: p.status,
    amount: Number(p.amount),
    trxId: p.trxId,
    senderAccount: p.senderAccount,
    verifiedByName: p.verifiedBy?.name ?? null,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <Suspense
      fallback={<div className="text-sm text-muted">Loading payments...</div>}
    >
      <PaymentsListClient
        initialPayments={rows}
        currencyCode={settings?.currencyCode ?? "USD"}
      />
    </Suspense>
  );
}
