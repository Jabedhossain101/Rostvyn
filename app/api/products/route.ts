import { NextResponse, type NextRequest } from "next/server";
import { RoastLevel } from "@prisma/client";
import { z } from "zod";
import { queryProducts } from "@/lib/storefront";

const productsQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  roast: z.enum(["LIGHT", "MEDIUM", "DARK"]).optional(),
  grind: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  featured: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "featured"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(48).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const raw: Record<string, string | undefined> = {
      q: sp.get("q") || undefined,
      category: sp.get("category") || undefined,
      roast: sp.get("roast")?.toUpperCase() || undefined,
      grind: sp.get("grind") || undefined,
      minPrice: sp.get("minPrice") || undefined,
      maxPrice: sp.get("maxPrice") || undefined,
      inStock: sp.get("inStock") || undefined,
      featured: sp.get("featured") || undefined,
      sort: sp.get("sort") || undefined,
      page: sp.get("page") || undefined,
      limit: sp.get("limit") || undefined,
    };

    const parsed = productsQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await queryProducts({
      ...parsed.data,
      roast: parsed.data.roast as RoastLevel | undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { error: "Failed to load products." },
      { status: 500 }
    );
  }
}
