import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import AliasForm from "@/components/AliasForm";
import VerificationUpload from "@/components/VerificationUpload";
import TrustBadges from "@/components/TrustBadges";

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      displayName: true,
      idVerified: true,
      bgCheckVerified: true,
      eduVerified: true,
      role: true,
      verificationRequests: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) redirect("/login");

  const latest = (type: "IDENTITY" | "BACKGROUND" | "EDUCATION") =>
    user.verificationRequests.find((r) => r.type === type);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink">帳號與安全</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-1 mb-8 text-sm text-ink/60">
        設定公開化名,並完成安全認證以提升信任度。
      </p>

      {/* 化名 */}
      <section className="rounded-2xl border border-line p-6">
        <h2 className="mb-1 font-bold text-ink">公開化名</h2>
        <p className="mb-4 text-xs text-ink/40">你的本名是「{user.name}」,僅平台保留。</p>
        <AliasForm displayName={user.displayName ?? ""} />
      </section>

      {/* 安全認證 */}
      <section className="mt-6 rounded-2xl border border-line p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-bold text-ink">安全認證</h2>
          <TrustBadges
            idVerified={user.idVerified}
            bgCheckVerified={user.bgCheckVerified}
            eduVerified={user.eduVerified}
          />
        </div>
        <p className="mb-5 text-xs text-ink/40">
          完成認證後,你的檔案會顯示信任徽章,讓家長與學生更安心。證件僅供審核使用。
        </p>

        <div className="space-y-5">
          <VerifyRow
            title="實名認證"
            desc="上傳身分證件,確認你的真實身分"
            verified={user.idVerified}
            req={latest("IDENTITY")}
            type="IDENTITY"
            label="身分證件"
          />
          <VerifyRow
            title="無犯罪紀錄查驗"
            desc="上傳警察刷局核發的良民證（無犯罪紀錄證明）"
            verified={user.bgCheckVerified}
            req={latest("BACKGROUND")}
            type="BACKGROUND"
            label="良民證"
          />
          {user.role === "TUTOR" && (
            <VerifyRow
              title="學歷與成績證明"
              desc="上傳畢業證書或成績單,證明你的學歷與學業表現"
              verified={user.eduVerified}
              req={latest("EDUCATION")}
              type="EDUCATION"
              label="畢業證書／成績單"
            />
          )}
        </div>
      </section>
    </div>
  );
}

function VerifyRow({
  title,
  desc,
  verified,
  req,
  type,
  label,
}: {
  title: string;
  desc: string;
  verified: boolean;
  req?: { status: string; note: string | null };
  type: "IDENTITY" | "BACKGROUND" | "EDUCATION";
  label: string;
}) {
  return (
    <div className="rounded-xl border border-line/10 p-4">
      <div className="flex items-center justify-between">
        <span className="font-medium text-ink">{title}</span>
        {verified ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            ✓ 已認證
          </span>
        ) : req?.status === "PENDING" ? (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            審核中
          </span>
        ) : (
          <span className="rounded-full bg-sun-soft/50 px-2 py-0.5 text-xs text-ink/40">
            未認證
          </span>
        )}
      </div>
      <p className="mt-0.5 mb-3 text-xs text-ink/40">{desc}</p>

      {!verified && req?.status !== "PENDING" && (
        <>
          {req?.status === "REJECTED" && (
            <p className="mb-2 text-xs text-red-500">
              上次審核未通過{req.note ? `：${req.note}` : ""},請重新上傳。
            </p>
          )}
          <VerificationUpload type={type} label={label} />
        </>
      )}
      {!verified && req?.status === "PENDING" && (
        <p className="text-xs text-amber-600">證件已送出,審核中 ⏳</p>
      )}
    </div>
  );
}
