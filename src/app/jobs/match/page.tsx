import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import JobMatchCard from "@/components/JobMatchCard";
import { rankJobs, type JobMatchProfile, type MatchJob } from "@/lib/match";

const RESULT_LIMIT = 12;
const POOL_LIMIT = 120;

// 提示框（未登入／非老師／未建檔）共用樣式
function Notice({
  title,
  desc,
  cta,
}: {
  title: string;
  desc: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <span className="rounded-full border border-line bg-sun px-3 py-1 text-xs font-extrabold text-ink">
        ✨ 智能接案
      </span>
      <h1 className="mt-5 font-serif text-3xl font-extrabold text-ink">{title}</h1>
      <p className="mt-3 text-sm font-medium leading-relaxed text-ink/65">{desc}</p>
      <Link
        href={cta.href}
        className="mt-7 inline-block rounded-full border border-line bg-sun px-7 py-3 font-bold text-paper transition hover:bg-sun-dark"
      >
        {cta.label}
      </Link>
    </div>
  );
}

export default async function JobMatchPage() {
  const session = await auth();
  if (!session?.user) {
    return (
      <Notice
        title="登入後即可智能接案"
        desc="登入老師帳號，系統會依你的專長、地區與時薪，自動找出最適合你接的家教需求。"
        cta={{ href: "/login", label: "前往登入" }}
      />
    );
  }

  const profile = await db.tutorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      subjects: true,
      levels: true,
      regions: true,
      hourlyRate: true,
      mode: true,
    },
  });

  if (!profile) {
    return (
      <Notice
        title="先建立老師檔案"
        desc="智能接案會依你的科目、可教學制、授課地區與時薪來配對需求。完成檔案後就能開始。"
        cta={{ href: "/dashboard/profile", label: "建立老師檔案" }}
      />
    );
  }

  if (profile.subjects.length === 0) {
    return (
      <Notice
        title="補上你的教學科目"
        desc="你的檔案還沒登記任何科目，無法配對。補上專長科目後即可看到最適合你的需求。"
        cta={{ href: "/dashboard/profile", label: "編輯老師檔案" }}
      />
    );
  }

  // 撈出徵求中的需求（排除自己發布的）
  const pool = (await db.jobPost.findMany({
    where: { status: "OPEN", studentId: { not: session.user.id } },
    take: POOL_LIMIT,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      subject: true,
      level: true,
      region: true,
      mode: true,
      budget: true,
      budgetMax: true,
      status: true,
      studentStatus: true,
      parentNeeds: true,
      createdAt: true,
      student: { select: { name: true } },
      _count: { select: { applications: true } },
    },
  })) as MatchJob[];

  const ranked = rankJobs(pool, profile as JobMatchProfile, RESULT_LIMIT);

  const favJobIds = new Set(
    (
      await db.favorite.findMany({
        where: { userId: session.user.id, jobId: { not: null } },
        select: { jobId: true },
      })
    ).map((f) => f.jobId)
  );

  // 老師已應徵過的案件（標記用，避免重複點入）
  const appliedJobIds = new Set(
    (
      await db.application.findMany({
        where: { tutorId: profile.id },
        select: { jobId: true },
      })
    ).map((a) => a.jobId)
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-line bg-sun px-3 py-1 text-xs font-extrabold text-paper">
          ✨ 智能接案
        </span>
      </div>
      <h1 className="mt-4 font-serif text-4xl font-extrabold text-ink">
        最適合你接的家教需求
      </h1>
      <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-ink/65">
        依你的專長（{profile.subjects.slice(0, 4).join("、")}
        {profile.subjects.length > 4 ? "…" : ""}）、授課地區與時薪，從徵求中的需求算出契合度排序。
      </p>

      {ranked.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-paper p-10 text-center">
          <p className="text-lg font-bold text-ink">目前沒有徵求中的需求</p>
          <p className="mt-2 text-sm text-ink/60">
            稍後再回來看看，或
            <Link href="/jobs" className="font-bold text-cobalt underline">
              瀏覽全部案件
            </Link>
            。
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-bold text-ink">
              為你推薦 {ranked.length} 筆需求
            </h2>
            <Link
              href="/jobs"
              className="text-sm font-bold text-ink/50 underline underline-offset-2 hover:text-ink"
            >
              改用篩選搜尋 →
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {ranked.map((r, i) => (
              <JobMatchCard
                key={r.job.id}
                result={r}
                rank={i + 1}
                favorited={favJobIds.has(r.job.id)}
                applied={appliedJobIds.has(r.job.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
