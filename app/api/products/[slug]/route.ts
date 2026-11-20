import { NextResponse } from "next/server";
import { z } from "zod";
import { getProductBySlug } from "@/lib/storefront";

const slugSchema = z.string().trim().min(1).max(160);

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid product slug." }, { status: 400 });
    }

    const data = await getProductBySlug(parsed.data);
    if (!data) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/products/[slug]]", error);
    return NextResponse.json(
      { error: "Failed to load product details." },
      { status: 500 }
    );
  }
}
