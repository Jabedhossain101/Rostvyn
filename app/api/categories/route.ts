import { NextResponse } from "next/server";
import { getActiveCategories } from "@/lib/storefront";

export async function GET() {
  try {
    const categories = await getActiveCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json(
      { error: "Failed to load categories." },
      { status: 500 }
    );
  }
}
