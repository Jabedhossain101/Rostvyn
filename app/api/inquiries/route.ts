import { NextResponse } from "next/server";
import { InquiryStatus, InquiryType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  inquiryType: z.enum(["SUPPORT", "WHOLESALE"]).default("SUPPORT"),
  message: z
    .string()
    .trim()
    .min(10, "Please tell us a bit more (at least 10 characters).")
    .max(3000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = inquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid inquiry details." },
        { status: 400 }
      );
    }

    const inquiry = await prisma.supportInquiry.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        phone: parsed.data.phone ? parsed.data.phone : null,
        inquiryType: parsed.data.inquiryType as InquiryType,
        message: parsed.data.message,
        status: InquiryStatus.NEW,
      },
      select: { id: true, inquiryType: true, status: true },
    });

    return NextResponse.json(
      {
        inquiry,
        message:
          parsed.data.inquiryType === "WHOLESALE"
            ? "Thank you for your wholesale inquiry. Our roastery partnerships lead will respond within 1 business day."
            : "Thank you for reaching out. Our concierge team will respond within 24 hours.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/inquiries]", error);
    return NextResponse.json(
      { error: "Unable to send your message right now. Please try again." },
      { status: 500 }
    );
  }
}
