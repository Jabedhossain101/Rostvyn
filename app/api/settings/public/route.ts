import { NextResponse } from "next/server";
import { getPublicSettings } from "@/lib/storefront";

export async function GET() {
  try {
    const settings = await getPublicSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("[GET /api/settings/public]", error);
    return NextResponse.json(
      { error: "Failed to load store settings." },
      { status: 500 }
    );
  }
}
