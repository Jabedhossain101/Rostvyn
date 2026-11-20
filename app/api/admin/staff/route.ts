import { NextResponse } from "next/server";
import { AdminRole, Prisma } from "@prisma/client";
import { z } from "zod";
import { hashPassword, requireAdmin, verifyPassword } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(100),
  email: z.string().trim().email("Valid email is required."),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(128),
  role: z.enum(["STAFF", "SUPER_ADMIN"]).default("STAFF"),
});

const patchStaffSchema = z.union([
  z.object({
    action: z.literal("toggleActive"),
    id: z.string().trim().min(1),
    isActive: z.boolean(),
  }),
  z.object({
    action: z.literal("rotateOwnPassword"),
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(10, "New password must be at least 10 characters.")
      .max(128),
  }),
]);

export async function GET() {
  const { errorResponse } = await requireAdmin({ superAdminOnly: true });
  if (errorResponse) return errorResponse;

  try {
    const users = await prisma.adminUser.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[GET /api/admin/staff]", error);
    return NextResponse.json(
      { error: "Failed to load admin accounts." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { errorResponse } = await requireAdmin({ superAdminOnly: true });
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid staff data." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.adminUser.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        role: parsed.data.role as AdminRole,
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An admin user with this email already exists." },
        { status: 409 }
      );
    }
    console.error("[POST /api/admin/staff]", error);
    return NextResponse.json(
      { error: "Failed to create staff account." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const { admin, errorResponse } = await requireAdmin({ superAdminOnly: true });
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const parsed = patchStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    if (parsed.data.action === "rotateOwnPassword") {
      const dbSelf = await prisma.adminUser.findUnique({
        where: { id: admin.id },
      });
      if (!dbSelf) {
        return NextResponse.json({ error: "Account not found." }, { status: 404 });
      }
      const valid = await verifyPassword(
        parsed.data.currentPassword,
        dbSelf.passwordHash
      );
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }

      const newHash = await hashPassword(parsed.data.newPassword);
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash: newHash },
      });

      return NextResponse.json({
        message: "Password updated successfully.",
      });
    }

    // Prevent self-deactivation
    if (parsed.data.id === admin.id && !parsed.data.isActive) {
      return NextResponse.json(
        { error: "You cannot deactivate your own active Super Admin account." },
        { status: 400 }
      );
    }

    const updated = await prisma.adminUser.update({
      where: { id: parsed.data.id },
      data: { isActive: parsed.data.isActive },
      select: { id: true, isActive: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[PATCH /api/admin/staff]", error);
    return NextResponse.json(
      { error: "Failed to update admin user." },
      { status: 500 }
    );
  }
}
