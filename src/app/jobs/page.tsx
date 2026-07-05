import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { expandRegions } from "@/lib/regions";
import JobCard from "@/components/JobCard";
import JobFilters from "@/components/JobFilters";
import JobMatchCard from "@/components/JobMatchCard";
import ModeTabs from "@/components/ModeTabs";
import { hasTutorProfile } from "@/lib/tutor";
import { becomeTutor } from "@/app/dashboard/actions";
import { rankJobs, type JobMatchProfile, type MatchJob } from "@/lib/match";

export const metadata = {
  title: "找案件",
  description: "瀏覽 Tomo 上開放中的家教需求案件：科目、地區、預算與學生狀況，老師可直接應徵。",
  alternates: { canonical: "/jobs" },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

// 多選參數：回傳字串陣列（科目／學制／地區可複選）
function arr(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v.filter(Boolean);
  return v ? [v] : [];
}

// 收藏中的案件 id（顯示愛心狀態）
async function favoriteJobIds(userId: string) {
  const favs = await db.favorite.findMany({
    where: { userId, jobId: { not: null } },
    select: { jobId: true },
  });
  return new Set(favs.map((f) => f.jobId));
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const isMatch = str(sp.view) === "match";

  const session = await auth();
  // 要應徵學生需求得先有老師檔案 → 提供建立/編輯入口
  const isTutor = session ? await hasTutorProfile(session.user.id) : false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-extrabold text-ink">找學生</h1>
          <div className="mt-2 h-1 w-14 bg-sun" />
          <p className="mt-3 text-sm font-bold text-ink/60">
            瀏覽徵求中的案件，或讓系統依你的專長智能推薦最適合接的需求。
          </p>
        </div>
        {isTutor ? (
          <Link
            href="/dashboard/profile"
            className="shrink-0 rounded-full border border-line bg-sun px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-sun-dark"
          >
            發佈 / 編輯 老師檔案
          </Link>
        ) : (
          <form action={becomeTutor}>
            <button
              type="submit"
              className="shrink-0 rounded-full border border-line bg-sun px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-sun-dark"
            >
              建立老師檔案 +
            </button>
          </form>
        )}
      </div>

      <div className="mt-6">
        <ModeTabs
          base="/jobs"
          active={isMatch ? "match" : "browse"}
          browseLabel="瀏覽案件"
          matchLabel="✨ 智能接案"
        />
      </div>

      {isMatch ? <MatchMode /> : <BrowseMode sp={sp} />}
    </div>
  );
}

// ── 瀏覽案件 ─────────────────────────────────────────────
const JOBS_PAGE_SIZE = 12;

async function BrowseMode({ sp }: { sp: Awaited<SearchParams> }) {
  const subjects = arr(sp.subject);
  const levels = arr(sp.level);
  const regions = arr(sp.region);
  const gender = str(sp.gender);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const where: Prisma.JobPostWhereInput = { status: "OPEN" };
  if (subjects.length) where.subject = { in: subjects };
  if (levels.length) where.level = { in: levels };
  if (regions.length) where.regions = { hasSome: expandRegions(regions) };
  if (gender === "MALE" || gender === "FEMALE") {
    where.student = { gender };
  }

  const [jobs, total] = await Promise.all([
    db.jobPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * JOBS_PAGE_SIZE,
      take: JOBS_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        subject: true,
        level: true,
        regions: true,
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
    }),
    db.jobPost.count({ where }),
  ]);

  const session = await auth();
  const favJobIds = session
    ? await favoriteJobIds(session.user.id)
    : new Set<string | null>();

  const totalPages = Math.ceil(total / JOBS_PAGE_SIZE);

  // 分頁連結：保留目前查詢參數
  function pageHref(p: number) {
    const params = new URLSearchParams();
    subjects.forEach((s) => params.append("subject", s));
    levels.forEach((l) => params.append("level", l));
    regions.forEach((r) => params.append("region", r));
    if (gender) params.set("gender", gender);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/jobs?${qs}` : "/jobs";
  }

  return (
    <>
      <p className="mt-5 text-sm font-bold text-ink/60">
        共 {total} 筆徵求中的案件
      </p>

      <div className="mt-3">
        <Suspense>
          <JobFilters />
        </Suspense>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-16 text-center font-bold text-ink/40">
          目前沒有符合條件的案件。
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} favorited={favJobIds.has(j.id)} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={pageHref(page - 1)}
              className="rounded-full border border-line px-3 py-1.5 text-sm font-bold hover:bg-sun"
            >
              上一頁
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              className={`rounded-full border border-line px-3.5 py-1.5 text-sm font-bold ${
                p === page ? "bg-sun text-paper" : "hover:bg-sun"
              }`}
            >
              {p}
            </Link>
          ))}
          {page < totalPages && (
            <Link
              href={pageHref(page + 1)}
              className="rounded-full border border-line px-3 py-1.5 text-sm font-bold hover:bg-sun"
            >
              下一頁
            </Link>
          )}
        </div>
      )}
    </>
  );
}

// ── 智能接案 ─────────────────────────────────────────────
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
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h2 className="font-serif text-2xl font-extrabold text-ink">{title}</h2>
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

async function MatchMode() {
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
      regions: true,
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
  const favJobIds = await favoriteJobIds(session.user.id);

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
    <>
      <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-ink/65">
        依你的專長（{profile.subjects.slice(0, 4).join("、")}
        {profile.subjects.length > 4 ? "…" : ""}
        ）、授課地區與時薪，從徵求中的需求算出契合度排序。
      </p>

      {ranked.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-paper p-10 text-center">
          <p className="text-lg font-bold text-ink">目前沒有徵求中的需求</p>
          <p className="mt-2 text-sm text-ink/60">
            稍後再回來看看，或切換到「瀏覽案件」看看全部。
          </p>
        </div>
      ) : (
        <>
          <h2 className="mt-6 font-serif text-2xl font-bold text-ink">
            為你推薦 {ranked.length} 筆需求
          </h2>
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
    </>
  );
}
