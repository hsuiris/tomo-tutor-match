import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div>
      <h1 className="mb-1 font-serif text-2xl font-extrabold text-ink">設定新密碼</h1>
      <p className="mb-6 text-sm text-ink/60">為你的 Tomo 帳號設定一組新密碼。</p>

      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <p className="rounded-lg bg-red-50 px-3 py-3 text-sm text-red-600">
            連結無效或缺少權杖，請重新申請重設密碼。
          </p>
          <Link
            href="/forgot-password"
            className="block text-center text-sm font-medium text-cobalt hover:underline"
          >
            重新申請 →
          </Link>
        </div>
      )}
    </div>
  );
}
