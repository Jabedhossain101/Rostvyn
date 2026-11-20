import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const newsletterSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  source: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email address." },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          alreadySubscribed: true,
          message:
            "You're already on the Rostvyn Dispatch list. Use code WELCOME10 for 10% off your first roast.",
        },
        { status: 200 }
      );
    }

    await prisma.newsletterSubscriber.create({
      data: {
        email,
        source: parsed.data.source || "homepage_footer",
      },
    });

    return NextResponse.json(
      {
        alreadySubscribed: false,
        message:
          "Welcome to the First-Order Club. Enjoy 10% off your first order with code WELCOME10.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/newsletter]", error);
    return NextResponse.json(
      { error: "Unable to subscribe right now. Please try again." },
      { status: 500 }
    );
  }
}
