import { redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { ReviewsHubClient } from "@/components/admin/ReviewsHubClient";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

  const [reviews, inquiries, subscribers] = await Promise.all([
    prisma.productReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { product: { select: { name: true } } },
    }),
    prisma.supportInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <ReviewsHubClient
      initialReviews={reviews.map((r) => ({
        id: r.id,
        productName: r.product.name,
        authorName: r.authorName,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        isFeatured: r.isFeatured,
        createdAt: r.createdAt.toISOString(),
      }))}
      initialInquiries={inquiries.map((inq) => ({
        id: inq.id,
        name: inq.name,
        email: inq.email,
        phone: inq.phone,
        inquiryType: inq.inquiryType,
        message: inq.message,
        status: inq.status,
        createdAt: inq.createdAt.toISOString(),
      }))}
      initialSubscribers={subscribers.map((s) => ({
        id: s.id,
        email: s.email,
        source: s.source,
        subscribedAt: s.subscribedAt.toISOString(),
      }))}
    />
  );
}
