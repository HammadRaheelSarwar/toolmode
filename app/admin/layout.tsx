import { redirect } from "next/navigation";
import { AdminShell } from "../../components/admin-shell";
import { requireAdmin } from "../../lib/admin.server";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await requireAdmin();
  if (!access.ok) redirect(access.status === 401 ? "/login?next=%2Fadmin" : "/dashboard");
  return <AdminShell role={access.role}>{children}</AdminShell>;
}
