import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, getPublicSettings } from "@/lib/storefront";
import { ProductDetailClient } from "@/components/storefront/ProductDetailClient";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);

  if (!data) {
    return { title: "Product Not Found" };
  }

  return {
    title: data.product.name,
    description: data.product.originNotes
      ? `${data.product.originNotes} — ${data.product.description.slice(0, 140)}`
      : data.product.description.slice(0, 155),
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [data, settings] = await Promise.all([
    getProductBySlug(slug),
    getPublicSettings(),
  ]);

  if (!data) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={data.product}
      reviews={data.reviews}
      crossSell={data.crossSell}
      settings={settings}
    />
  );
}
