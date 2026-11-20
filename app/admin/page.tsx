import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CreditCard,
  DollarSign,
  Package,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { FulfillmentStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { getServerAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import {
  FulfillmentBadge,
  PaymentStatusBadge,
} from "@/components/admin/AdminBadges";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

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
      include: { payment: { select: { status: true, method: true } } },
    }),
    prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING_VERIFICATION },
      orderBy: { createdAt: "asc" },
      take: 6,
      include: {
        order: { select: { id: true, orderRef: true, customerName: true } },
      },
    }),
    prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { currencyCode: true },
    }),
  ]);

  const currencyCode = settings?.currencyCode ?? "USD";
  const totalRevenue = Number(revenueAgg._sum.totalAmount ?? 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-terracotta font-semibold">
            Executive Overview
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-espresso mt-0.5">
            Roastery Operations Dashboard
          </h1>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-espresso text-alabaster px-5 py-3 text-xs uppercase tracking-[0.16em] font-medium hover:bg-roast transition-colors self-start"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Action Alert Banner for Pending Manual TrxID Verifications */}
      {pendingManualPaymentsCount > 0 && (
        <div className="border border-terracotta/50 bg-amber-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-terracotta shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-espresso">
                {pendingManualPaymentsCount} Manual Bank Transfer{" "}
                {pendingManualPaymentsCount === 1 ? "Payment" : "Payments"}{" "}
                Awaiting TrxID Verification
              </p>
              <p className="text-xs text-roast mt-0.5">
                Verify incoming transfer references to release orders for
                roasting and dispatch.
              </p>
            </div>
          </div>
          <Link
            href="/admin/payments?status=PENDING_VERIFICATION"
            className="inline-flex items-center gap-1.5 bg-terracotta text-alabaster px-4 py-2.5 text-xs uppercase tracking-[0.14em] font-medium hover:bg-rust transition-colors shrink-0 self-start sm:self-auto"
          >
            Review Payments
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="border border-stone-border bg-surface p-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted mb-3">
            <span>Total Revenue</span>
            <DollarSign className="h-4 w-4 text-terracotta" />
          </div>
          <p className="font-serif text-3xl font-semibold text-espresso">
            {formatCurrency(totalRevenue, currencyCode)}
          </p>
          <p className="text-xs text-muted mt-1.5">Excludes cancelled orders</p>
        </div>

        <div className="border border-stone-border bg-surface p-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted mb-3">
            <span>Total Orders</span>
            <ShoppingBag className="h-4 w-4 text-terracotta" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <p className="font-serif text-3xl font-semibold text-espresso">
              {totalOrders}
            </p>
            {pendingOrders > 0 && (
              <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[11px] font-semibold">
                {pendingOrders} Pending
              </span>
            )}
          </div>
          <Link
            href="/admin/orders"
            className="inline-block text-xs text-terracotta hover:underline mt-1.5"
          >
            Manage orders →
          </Link>
        </div>

        <div className="border border-stone-border bg-surface p-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted mb-3">
            <span>Active Catalog</span>
            <Package className="h-4 w-4 text-terracotta" />
          </div>
          <p className="font-serif text-3xl font-semibold text-espresso">
            {activeProducts}
          </p>
          <Link
            href="/admin/products"
            className="inline-block text-xs text-terracotta hover:underline mt-1.5"
          >
            View products →
          </Link>
        </div>

        <div className="border border-stone-border bg-surface p-6">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted mb-3">
            <span>Low Stock Alerts (≤ 5)</span>
            <Boxes className="h-4 w-4 text-rust" />
          </div>
          <p
            className={`font-serif text-3xl font-semibold ${
              lowStockCount > 0 ? "text-rust" : "text-espresso"
            }`}
          >
            {lowStockCount}
          </p>
          <Link
            href="/admin/inventory"
            className="inline-block text-xs text-terracotta hover:underline mt-1.5"
          >
            Inspect inventory →
          </Link>
        </div>
      </div>

      {/* Main Split: Recent Orders + Payment Audit Queue */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Recent Orders Table */}
        <section className="xl:col-span-8 border border-stone-border bg-surface">
          <div className="px-6 py-4 border-b border-stone-border flex items-center justify-between">
            <h2 className="font-serif text-2xl font-medium text-espresso">
              Recent Orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs uppercase tracking-[0.14em] text-terracotta hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-border bg-linen/70 text-[11px] uppercase tracking-[0.14em] text-roast">
                  <th className="py-3 px-5 font-semibold">Order Ref</th>
                  <th className="py-3 px-5 font-semibold">Customer</th>
                  <th className="py-3 px-5 font-semibold">Total</th>
                  <th className="py-3 px-5 font-semibold">Fulfillment</th>
                  <th className="py-3 px-5 font-semibold">Payment</th>
                  <th className="py-3 px-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-border">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted text-sm">
                      No orders have been placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-alabaster/70">
                      <td className="py-3.5 px-5 font-mono text-xs font-semibold text-espresso">
                        {order.orderRef}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-medium text-espresso">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-muted">
                          {order.customerPhone}
                        </p>
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-espresso">
                        {formatCurrency(
                          Number(order.totalAmount),
                          currencyCode
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <FulfillmentBadge status={order.fulfillmentStatus} />
                      </td>
                      <td className="py-3.5 px-5">
                        {order.payment ? (
                          <PaymentStatusBadge status={order.payment.status} />
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs uppercase tracking-[0.12em] text-terracotta hover:underline font-medium"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment Audit Queue */}
        <section className="xl:col-span-4 border border-stone-border bg-surface">
          <div className="px-6 py-4 border-b border-stone-border flex items-center justify-between">
            <h2 className="font-serif text-2xl font-medium text-espresso flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-terracotta" />
              Payment Audit Queue
            </h2>
            <Link
              href="/admin/payments"
              className="text-xs uppercase tracking-[0.14em] text-terracotta hover:underline"
            >
              Ledger
            </Link>
          </div>

          <div className="divide-y divide-stone-border">
            {paymentAuditQueue.length === 0 ? (
              <p className="p-6 text-sm text-muted text-center">
                No pending payment verifications.
              </p>
            ) : (
              paymentAuditQueue.map((p) => (
                <div
                  key={p.id}
                  className="p-4 hover:bg-alabaster/70 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-espresso">
                      {p.order.orderRef}
                    </p>
                    <p className="text-xs text-roast truncate">
                      {p.order.customerName} • {p.method}
                    </p>
                    {p.trxId && (
                      <p className="text-[11px] font-mono text-terracotta mt-0.5 truncate">
                        TrxID: {p.trxId}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-espresso">
                      {formatCurrency(Number(p.amount), currencyCode)}
                    </p>
                    <Link
                      href={`/admin/payments/${p.id}`}
                      className="text-[11px] uppercase tracking-wider text-terracotta hover:underline"
                    >
                      Audit →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
