import { redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  PromotionsClient,
  type AdminPromoRow,
} from "@/components/admin/PromotionsClient";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

  const [promos, settings] = await Promise.all([
    prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { currencyCode: true },
    }),
  ]);

  const rows: AdminPromoRow[] = promos.map((p) => ({
    id: p.id,
    code: p.code,
    discountType: p.discountType,
    discountValue: Number(p.discountValue),
    minOrderAmount: Number(p.minOrderAmount),
    maxUses: p.maxUses,
    usedCount: p.usedCount,
    expiresAt: p.expiresAt?.toISOString() ?? null,
    isActive: p.isActive,
  }));

  return (
    <PromotionsClient
      initialPromos={rows}
      currencyCode={settings?.currencyCode ?? "USD"}
    />
  );
}
