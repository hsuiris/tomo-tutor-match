import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isEmailVerified } from "@/lib/verify-email";

// 會員面板：未驗證 Email 前先去驗證
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (!(await isEmailVerified(session.user.id))) redirect("/verify-email");
  return children;
}
