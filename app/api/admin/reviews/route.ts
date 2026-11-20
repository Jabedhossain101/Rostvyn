import { NextResponse } from "next/server";
import { ReviewStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const patchReviewSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const reviews = await prisma.productReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        product: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        productName: r.product.name,
        productSlug: r.product.slug,
        authorName: r.authorName,
        rating: r.rating,
        comment: r.comment,
        isVerifiedPurchase: r.isVerifiedPurchase,
        status: r.status,
        isFeatured: r.isFeatured,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/reviews]", error);
    return NextResponse.json(
      { error: "Failed to load reviews." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = patchReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid review update." },
        { status: 400 }
      );
    }

    const updated = await prisma.productReview.update({
      where: { id: parsed.data.id },
      data: {
        ...(parsed.data.status !== undefined
          ? { status: parsed.data.status as ReviewStatus }
          : {}),
        ...(parsed.data.isFeatured !== undefined
          ? { isFeatured: parsed.data.isFeatured }
          : {}),
      },
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      isFeatured: updated.isFeatured,
    });
  } catch (error) {
    console.error("[PATCH /api/admin/reviews]", error);
    return NextResponse.json(
      { error: "Failed to moderate review." },
      { status: 500 }
    );
  }
}
