import { notFound, redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  PaymentDetailClient,
  type AdminPaymentDetail,
} from "@/components/admin/PaymentDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const [payment, settings] = await Promise.all([
    prisma.payment.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, orderRef: true, customerName: true, customerPhone: true } },
        verifiedBy: { select: { name: true } },
      },
    }),
    prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { currencyCode: true },
    }),
  ]);

  if (!payment) notFound();

  const serialized: AdminPaymentDetail = {
    id: payment.id,
    orderId: payment.order.id,
    orderRef: payment.order.orderRef,
    customerName: payment.order.customerName,
    customerPhone: payment.order.customerPhone,
    method: payment.method,
    status: payment.status,
    amount: Number(payment.amount),
    trxId: payment.trxId,
    senderAccount: payment.senderAccount,
    auditNote: payment.auditNote,
    verifiedAt: payment.verifiedAt?.toISOString() ?? null,
    verifiedByName: payment.verifiedBy?.name ?? null,
    createdAt: payment.createdAt.toISOString(),
  };

  return (
    <PaymentDetailClient
      payment={serialized}
      currencyCode={settings?.currencyCode ?? "USD"}
    />
  );
}
