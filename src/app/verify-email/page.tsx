import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isEmailVerified, verifyEmailToken } from "@/lib/verify-email";
import ResendVerificationButton from "@/components/ResendVerificationButton";
import AutoRedirect from "@/components/AutoRedirect";

export const metadata = {
  title: "驗證 Email",
  description: "完成 Email 驗證後即可使用 Tomo 的完整功能。",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  // 帶 token：執行驗證（冪等，重複點連結不會壞）
  if (token) {
    const verifiedUserId = await verifyEmailToken(token);
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        {verifiedUserId ? (
          <>
            {/* 註冊不分老師/學生端，統一導向面板 */}
            <AutoRedirect to="/dashboard" />
            <p className="text-4xl">✅</p>
            <h1 className="mt-4 font-serif text-2xl font-extrabold text-ink">
              Email 驗證完成
            </h1>
            <p className="mt-2 text-ink/60">
              你的帳號已啟用，正在前往你的面板⋯
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-block rounded-full bg-sun px-7 py-2.5 text-sm font-bold text-paper hover:bg-sun-dark"
            >
              前往我的面板
            </Link>
          </>
        ) : (
          <>
            <p className="text-4xl">⚠️</p>
            <h1 className="mt-4 font-serif text-2xl font-extrabold text-ink">
              連結無效或已過期
            </h1>
            <p className="mt-2 text-ink/60">
              驗證連結僅 24 小時有效。請登入後重寄一封新的驗證信。
            </p>
            <div className="mt-8 flex justify-center">
              <ResendVerificationButton />
            </div>
          </>
        )}
      </div>
    );
  }

  // 沒帶 token：顯示「去收信」引導（已驗證者直接回面板）
  const session = await auth();
  if (session && (await isEmailVerified(session.user.id))) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-4xl">📮</p>
      <h1 className="mt-4 font-serif text-2xl font-extrabold text-ink">
        請驗證你的 Email
      </h1>
      <p className="mt-2 leading-relaxed text-ink/60">
        我們已寄出驗證信，請到信箱點擊驗證連結（含垃圾郵件匣）。
        完成驗證前，發案、應徵、私訊等功能會暫時無法使用。
      </p>
      <div className="mt-8 flex justify-center">
        {session ? (
          <ResendVerificationButton />
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-sun px-7 py-2.5 text-sm font-bold text-paper hover:bg-sun-dark"
          >
            登入後重寄驗證信
          </Link>
        )}
      </div>
    </div>
  );
}
