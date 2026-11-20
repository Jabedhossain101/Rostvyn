import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifyAdminToken,
  type AdminSessionPayload,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plainPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

export async function getServerAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export interface VerifiedAdmin {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "STAFF";
}

export async function requireAdmin(options?: {
  superAdminOnly?: boolean;
}): Promise<
  | { admin: VerifiedAdmin; errorResponse: null }
  | { admin: null; errorResponse: NextResponse }
> {
  const session = await getServerAdminSession();
  if (!session) {
    return {
      admin: null,
      errorResponse: NextResponse.json(
        { error: "Unauthorized. Admin authentication required." },
        { status: 401 }
      ),
    };
  }

  const dbAdmin = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!dbAdmin || !dbAdmin.isActive) {
    return {
      admin: null,
      errorResponse: NextResponse.json(
        { error: "Unauthorized. Admin account is inactive." },
        { status: 401 }
      ),
    };
  }

  if (options?.superAdminOnly && dbAdmin.role !== "SUPER_ADMIN") {
    return {
      admin: null,
      errorResponse: NextResponse.json(
        { error: "Forbidden. Super Admin privileges are required for this action." },
        { status: 403 }
      ),
    };
  }

  return {
    admin: {
      id: dbAdmin.id,
      email: dbAdmin.email,
      name: dbAdmin.name,
      role: dbAdmin.role,
    },
    errorResponse: null,
  };
}
