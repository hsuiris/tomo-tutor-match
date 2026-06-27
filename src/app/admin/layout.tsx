import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-ink/60">
        此頁面僅限管理員。
      </div>
    );
  }
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row">
      <AdminNav />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
