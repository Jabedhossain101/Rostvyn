import { NextResponse, type NextRequest } from "next/server";
import { ReviewStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getFeaturedReviews } from "@/lib/storefront";

const createReviewSchema = z.object({
  productId: z.string().trim().min(1, "Product is required."),
  authorName: z
    .string()
    .trim()
    .min(2, "Please enter your name (at least 2 characters).")
    .max(80, "Name is too long."),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5.")
    .max(5, "Rating must be between 1 and 5."),
  comment: z
    .string()
    .trim()
    .min(10, "Please share a few words about your brew (min 10 characters).")
    .max(1500, "Review comment is too long."),
});

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const productId = sp.get("productId");
    const featured = sp.get("featured") === "true";

    if (featured) {
      const data = await getFeaturedReviews();
      return NextResponse.json(data);
    }

    if (productId) {
      const rows = await prisma.productReview.findMany({
        where: {
          productId,
          status: ReviewStatus.APPROVED,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        reviews: rows.map((r) => ({
          id: r.id,
          productId: r.productId,
          authorName: r.authorName,
          rating: r.rating,
          comment: r.comment,
          isVerifiedPurchase: r.isVerifiedPurchase,
          isFeatured: r.isFeatured,
          createdAt: r.createdAt.toISOString(),
        })),
      });
    }

    const rows = await prisma.productReview.findMany({
      where: { status: ReviewStatus.APPROVED },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { product: { select: { name: true, slug: true } } },
    });

    return NextResponse.json({
      reviews: rows.map((r) => ({
        id: r.id,
        productId: r.productId,
        productName: r.product.name,
        productSlug: r.product.slug,
        authorName: r.authorName,
        rating: r.rating,
        comment: r.comment,
        isVerifiedPurchase: r.isVerifiedPurchase,
        isFeatured: r.isFeatured,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/reviews]", error);
    return NextResponse.json(
      { error: "Failed to load reviews." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid review submission." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: { id: parsed.data.productId, isActive: true },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const review = await prisma.productReview.create({
      data: {
        productId: parsed.data.productId,
        authorName: parsed.data.authorName,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        status: ReviewStatus.PENDING,
        isVerifiedPurchase: false,
        isFeatured: false,
      },
      select: { id: true, status: true },
    });

    return NextResponse.json(
      {
        review,
        message:
          "Thank you for your tasting notes. Your review has been submitted for moderation.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/reviews]", error);
    return NextResponse.json(
      { error: "Unable to submit review right now." },
      { status: 500 }
    );
  }
}
