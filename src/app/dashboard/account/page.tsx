import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import PasswordForm from "@/components/PasswordForm";
import NotificationForm from "@/components/NotificationForm";
import VerificationSection from "@/components/VerificationSection";

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      idVerified: true,
      bgCheckVerified: true,
      eduVerified: true,
      emailNotifications: true,
      notifyJobUpdates: true,
      notifyMessages: true,
      verificationRequests: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) redirect("/login");

  // 老師的安全認證已移到「編輯老師檔案」；此頁只對非老師（家長/學生）顯示
  const isTutor = user.role === "TUTOR";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink">帳號與安全</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-1 mb-8 text-sm text-ink/60">
        管理密碼、安全與通知設定。
      </p>

      {/* 修改密碼 */}
      <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-ink">修改密碼</h2>
        <PasswordForm />
      </section>

      {/* 安全認證（非老師才在此顯示；老師在「編輯老師檔案」） */}
      {!isTutor && (
        <div className="mt-6">
          <VerificationSection
            idVerified={user.idVerified}
            bgCheckVerified={user.bgCheckVerified}
            eduVerified={user.eduVerified}
            requests={user.verificationRequests}
            showEducation={false}
            intro="安全認證為選填，沒有認證也能正常使用平台徵家教；但完成認證會顯示信任徽章，家長與老師雙方都會更放心。證件僅供審核使用，審核後即刪除。"
          />
        </div>
      )}

      {/* 通知設定 */}
      <section className="mt-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-bold text-ink">通知設定</h2>
        <NotificationForm
          emailNotifications={user.emailNotifications}
          notifyJobUpdates={user.notifyJobUpdates}
          notifyMessages={user.notifyMessages}
        />
      </section>

      {/* 平台安全與隱私 */}
      <section className="mt-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="mb-2 font-bold text-ink">平台安全與隱私</h2>
        <p className="mb-3 text-sm text-ink/60">
          我們以加密儲存密碼、全站 HTTPS、登入速率限制保護你的帳號；證件影像於審核後立即刪除。
        </p>
        <Link
          href="/privacy"
          className="text-sm font-bold text-cobalt hover:underline"
        >
          隱私權政策與個資蒐集告知 →
        </Link>
      </section>
    </div>
  );
}
