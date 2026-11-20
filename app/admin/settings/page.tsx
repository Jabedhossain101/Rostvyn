import { redirect } from "next/navigation";
import { getServerAdminSession } from "@/lib/auth-server";
import { getPublicSettings } from "@/lib/storefront";
import { prisma } from "@/lib/prisma";
import {
  SettingsClient,
  type AdminUserRow,
} from "@/components/admin/SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getServerAdminSession();
  if (!session) redirect("/admin/login");

  const settings = await getPublicSettings();

  let staff: AdminUserRow[] = [];
  if (session.role === "SUPER_ADMIN") {
    const users = await prisma.adminUser.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      },
    });
    staff = users.map((u) => ({
      ...u,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    }));
  }

  return (
    <SettingsClient
      initialSettings={settings}
      initialStaff={staff}
      currentAdminRole={session.role}
      currentAdminId={session.sub}
    />
  );
}
