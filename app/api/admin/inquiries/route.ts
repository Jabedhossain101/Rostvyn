import { NextResponse } from "next/server";
import { InquiryStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const patchInquirySchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(["NEW", "REPLIED", "ARCHIVED"]),
});

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const inquiries = await prisma.supportInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      inquiries: inquiries.map((inq) => ({
        id: inq.id,
        name: inq.name,
        email: inq.email,
        phone: inq.phone,
        inquiryType: inq.inquiryType,
        message: inq.message,
        status: inq.status,
        createdAt: inq.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/inquiries]", error);
    return NextResponse.json(
      { error: "Failed to load inquiries." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = patchInquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid inquiry update." },
        { status: 400 }
      );
    }

    const updated = await prisma.supportInquiry.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status as InquiryStatus },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (error) {
    console.error("[PATCH /api/admin/inquiries]", error);
    return NextResponse.json(
      { error: "Failed to update inquiry." },
      { status: 500 }
    );
  }
}
