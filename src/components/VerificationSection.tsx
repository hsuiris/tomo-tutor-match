import VerificationUpload from "@/components/VerificationUpload";
import TrustBadges from "@/components/TrustBadges";

type Req = { type: string; status: string; note: string | null };

export default function VerificationSection({
  idVerified,
  bgCheckVerified,
  eduVerified,
  requests,
  showEducation,
  intro,
}: {
  idVerified: boolean;
  bgCheckVerified: boolean;
  eduVerified: boolean;
  requests: Req[];
  showEducation: boolean;
  intro: string;
}) {
  const latest = (type: "IDENTITY" | "BACKGROUND" | "EDUCATION") =>
    requests.find((r) => r.type === type);

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-bold text-ink">安全認證</h2>
        <TrustBadges
          idVerified={idVerified}
          bgCheckVerified={bgCheckVerified}
          eduVerified={eduVerified}
        />
      </div>
      <p className="mb-5 text-xs text-ink/40">{intro}</p>

      <div className="space-y-5">
        <VerifyRow
          title="實名認證"
          desc="上傳身分證件,確認你的真實身分"
          verified={idVerified}
          req={latest("IDENTITY")}
          type="IDENTITY"
          label="身分證件"
        />
        <VerifyRow
          title="無犯罪紀錄查驗"
          desc="上傳警察刷局核發的良民證（無犯罪紀錄證明）"
          verified={bgCheckVerified}
          req={latest("BACKGROUND")}
          type="BACKGROUND"
          label="良民證"
        />
        {showEducation && (
          <VerifyRow
            title="學歷與成績證明"
            desc="上傳畢業證書或成績單,證明你的學歷與學業表現"
            verified={eduVerified}
            req={latest("EDUCATION")}
            type="EDUCATION"
            label="畢業證書／成績單"
          />
        )}
      </div>
    </section>
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
  req?: Req;
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
