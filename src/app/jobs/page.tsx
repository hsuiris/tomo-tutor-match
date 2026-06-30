import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import JobCard from "@/components/JobCard";
import JobFilters from "@/components/JobFilters";
import { hasTutorProfile } from "@/lib/tutor";
import { becomeTutor } from "@/app/dashboard/actions";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

// 多選參數：回傳字串陣列（科目／學制／地區可複選）
function arr(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v.filter(Boolean);
  return v ? [v] : [];
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const subjects = arr(sp.subject);
  const levels = arr(sp.level);
  const regions = arr(sp.region);
  const gender = str(sp.gender);

  const where: Prisma.JobPostWhereInput = { status: "OPEN" };
  if (subjects.length) where.subject = { in: subjects };
  if (levels.length) where.level = { in: levels };
  if (regions.length) where.region = { in: regions };
  if (gender === "MALE" || gender === "FEMALE") {
    where.student = { gender };
  }

  const jobs = await db.jobPost.findMany({
    where,
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
  });

  // 目前使用者收藏的學生卡（用來顯示愛心狀態）
  const session = await auth();
  const favJobIds = session
    ? new Set(
        (
          await db.favorite.findMany({
            where: { userId: session.user.id, jobId: { not: null } },
            select: { jobId: true },
          })
        ).map((f) => f.jobId)
      )
    : new Set<string | null>();

  // 要應徵學生需求得先有老師檔案 → 提供建立/編輯入口
  const isTutor = session ? await hasTutorProfile(session.user.id) : false;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-extrabold text-ink">找學生</h1>
          <div className="mt-2 h-1 w-14 bg-sun" />
          <p className="mt-3 text-sm font-bold text-ink/60">
            共 {jobs.length} 筆徵求中的案件
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
    </div>
  );
}
