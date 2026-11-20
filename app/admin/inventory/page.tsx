import { redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  InventoryClient,
  type InventoryLogRow,
  type InventoryVariantRow,
} from "@/components/admin/InventoryClient";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

  const [variants, logs] = await Promise.all([
    prisma.productVariant.findMany({
      orderBy: [{ stockCount: "asc" }, { updatedAt: "desc" }],
      include: {
        product: {
          select: { name: true, category: { select: { name: true } } },
        },
      },
    }),
    prisma.inventoryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        variant: {
          select: {
            name: true,
            sku: true,
            product: { select: { name: true } },
          },
        },
        admin: { select: { name: true } },
      },
    }),
  ]);

  const variantRows: InventoryVariantRow[] = variants.map((v) => ({
    id: v.id,
    productName: v.product.name,
    categoryName: v.product.category.name,
    name: v.name,
    sku: v.sku,
    stockCount: v.stockCount,
    isActive: v.isActive,
  }));

  const logRows: InventoryLogRow[] = logs.map((l) => ({
    id: l.id,
    sku: l.variant.sku,
    productName: l.variant.product.name,
    variantName: l.variant.name,
    quantityDelta: l.quantityDelta,
    previousStock: l.previousStock,
    newStock: l.newStock,
    reason: l.reason,
    adminName: l.admin?.name ?? "System / Guest Checkout",
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <InventoryClient initialVariants={variantRows} initialLogs={logRows} />
  );
}
