import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { expandRegions } from "@/lib/regions";
import JobCard from "@/components/JobCard";
import JobFilters from "@/components/JobFilters";
import { hasTutorProfile } from "@/lib/tutor";
import { becomeTutor } from "@/app/dashboard/actions";

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
            用科目、學制、地區等條件，瀏覽徵求中的家教案件。
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

      <BrowseMode sp={sp} />
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
