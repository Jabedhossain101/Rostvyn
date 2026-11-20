import { NextResponse } from "next/server";
import { getServerAdminSession } from "@/lib/auth-server";

export async function GET() {
  const session = await getServerAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    admin: {
      id: session.sub,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
}
