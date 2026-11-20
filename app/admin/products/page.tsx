import { redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import {
  ProductsTableClient,
  type AdminProductRow,
} from "@/components/admin/ProductsTableClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

  const [products, settings] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        variants: { select: { stockCount: true } },
      },
    }),
    prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { currencyCode: true },
    }),
  ]);

  const rows: AdminProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    categoryName: p.category.name,
    roastLevel: p.roastLevel,
    basePrice: Number(p.basePrice),
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    variantCount: p.variants.length,
    totalStock: p.variants.reduce((sum, v) => sum + v.stockCount, 0),
    image: p.images[0] ?? null,
  }));

  return (
    <ProductsTableClient
      initialProducts={rows}
      currencyCode={settings?.currencyCode ?? "USD"}
    />
  );
}
