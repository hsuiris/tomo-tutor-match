import Link from "next/link";
import { Prisma } from "@/generated/prisma";
import { db } from "@/lib/db";
import { closeJob } from "@/app/admin/actions";

export const metadata = { title: "媒合管理 · TutorMatch" };

const PER = 50;
const STATUSES = ["OPEN", "MATCHED", "CLOSED"] as const;
const STATUS_LABEL: Record<string, string> = {
  OPEN: "徵求中",
  MATCHED: "已媒合",
  CLOSED: "已關閉",
};

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const status = str(sp.status);
  const page = Math.max(1, parseInt(str(sp.page)) || 1);

  const where: Prisma.JobPostWhereInput = {};
  if (STATUSES.includes(status as (typeof STATUSES)[number])) {
    where.status = status as (typeof STATUSES)[number];
  }

  const [total, jobs] = await Promise.all([
    db.jobPost.count({ where }),
    db.jobPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER,
      take: PER,
      select: {
        id: true,
        title: true,
        subject: true,
        region: true,
        status: true,
        createdAt: true,
        _count: { select: { applications: true } },
        applications: {
          where: { status: "ACCEPTED" },
          take: 1,
          select: {
            tutor: {
              select: {
                user: { select: { name: true, displayName: true } },
              },
            },
          },
        },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER));

  return (
    <div>
      <h1 className="font-serif text-3xl font-extrabold text-ink">媒合管理</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-3 mb-5 text-sm font-bold text-ink/60">共 {total} 件</p>

      <div className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/admin/matches"
          className={`rounded-full border border-line px-3 py-1 text-sm font-bold ${
            status ? "text-ink/60" : "bg-sun text-paper"
          }`}
        >
          全部
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/matches?status=${s}`}
            className={`rounded-full border border-line px-3 py-1 text-sm font-bold ${
              status === s ? "bg-sun text-paper" : "text-ink/60"
            }`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-sun-soft/30 text-left text-ink/60">
            <tr>
              <th className="px-3 py-2 font-bold">案件</th>
              <th className="px-3 py-2 font-bold">科目</th>
              <th className="px-3 py-2 font-bold">地區</th>
              <th className="px-3 py-2 font-bold">狀態</th>
              <th className="px-3 py-2 font-bold">應徵</th>
              <th className="px-3 py-2 font-bold">已媒合</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => {
              const matched = j.applications[0]?.tutor.user;
              return (
                <tr key={j.id} className="border-t border-line">
                  <td className="px-3 py-2 font-bold text-ink">{j.title}</td>
                  <td className="px-3 py-2 text-ink/70">{j.subject}</td>
                  <td className="px-3 py-2 text-ink/70">{j.region}</td>
                  <td className="px-3 py-2 text-ink/70">
                    {STATUS_LABEL[j.status]}
                  </td>
                  <td className="px-3 py-2 text-ink/70">
                    {j._count.applications}
                  </td>
                  <td className="px-3 py-2 text-ink/70">
                    {matched ? (matched.displayName ?? matched.name) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {j.status !== "CLOSED" && (
                      <form action={closeJob.bind(null, j.id)}>
                        <button className="rounded-full border border-line px-3 py-1 text-xs font-bold text-ink/70 hover:bg-sun-soft/40">
                          關閉
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-ink/40">
                  沒有符合的案件。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 && (
            <Link
              href={`/admin/matches?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page - 1) }).toString()}`}
              className="font-bold text-cobalt"
            >
              ← 上一頁
            </Link>
          )}
          <span className="text-ink/50">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link
              href={`/admin/matches?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page + 1) }).toString()}`}
              className="font-bold text-cobalt"
            >
              下一頁 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
