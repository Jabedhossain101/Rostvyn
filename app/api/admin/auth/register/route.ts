import { NextResponse } from "next/server";
import { AdminRole, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionCookieOptions, signAdminToken } from "@/lib/auth";
import { hashPassword } from "@/lib/auth-server";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name (at least 2 characters).")
    .max(100),
  email: z.string().trim().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128),
  role: z.enum(["SUPER_ADMIN", "STAFF"]).optional().default("SUPER_ADMIN"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Please check your registration details.",
        },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    const existing = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An admin account with this email is already registered." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const admin = await prisma.adminUser.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: parsed.data.role as AdminRole,
        isActive: true,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const token = await signAdminToken({
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json({ admin }, { status: 201 });
    response.cookies.set({
      ...getSessionCookieOptions(),
      value: token,
    });

    return response;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An admin account with this email is already registered." },
        { status: 409 }
      );
    }
    console.error("[Admin Register Error]", error);
    return NextResponse.json(
      { error: "Unable to create demo account right now. Please try again." },
      { status: 500 }
    );
  }
}
