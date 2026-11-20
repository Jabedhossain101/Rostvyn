import { getServerAdminSession } from "@/lib/auth-server";
import { AdminSidebarShell } from "@/components/admin/AdminSidebarShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAdminSession();

  if (!session) {
    return <>{children}</>;
  }

  return (
    <AdminSidebarShell
      admin={{
        name: session.name,
        email: session.email,
        role: session.role,
      }}
    >
      {children}
    </AdminSidebarShell>
  );
}
