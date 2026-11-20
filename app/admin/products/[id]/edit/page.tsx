import { notFound, redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ProductFormClient } from "@/components/admin/ProductFormClient";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <ProductFormClient
      mode="edit"
      categories={categories}
      initial={{
        id: product.id,
        categoryId: product.categoryId,
        name: product.name,
        slug: product.slug,
        description: product.description,
        roastLevel: product.roastLevel ?? "",
        originNotes: product.originNotes ?? "",
        basePrice: String(Number(product.basePrice)),
        comparePrice:
          product.comparePrice !== null ? String(Number(product.comparePrice)) : "",
        imagesText: product.images.join("\n"),
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        variants: product.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          priceOverride:
            v.priceOverride !== null ? String(Number(v.priceOverride)) : "",
          stockCount: String(v.stockCount),
          isActive: v.isActive,
        })),
      }}
    />
  );
}
