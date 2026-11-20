import { redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ProductFormClient } from "@/components/admin/ProductFormClient";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return <ProductFormClient mode="create" categories={categories} />;
}
