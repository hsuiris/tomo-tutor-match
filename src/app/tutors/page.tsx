import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import TutorCard from "@/components/TutorCard";
import TutorFilters from "@/components/TutorFilters";
import { PAGE_SIZE } from "@/lib/constants";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

// 多選參數：回傳字串陣列（科目／學制／地區可複選）
function arr(v: string | string[] | undefined): string[] {
  if (Array.isArray(v)) return v.filter(Boolean);
  return v ? [v] : [];
}

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = str(sp.q);
  const subjects = arr(sp.subject);
  const levels = arr(sp.level);
  const regions = arr(sp.region);
  const eduLevels = arr(sp.edu);
  const university = str(sp.uni);
  const min = parseInt(str(sp.min));
  const max = parseInt(str(sp.max));
  const gender = str(sp.gender);
  const sort = str(sp.sort) || "recommended";
  const page = Math.max(1, parseInt(str(sp.page)) || 1);

  // 組查詢條件
  const where: Prisma.TutorProfileWhereInput = { isPublished: true };
  if (subjects.length) where.subjects = { hasSome: subjects };
  if (levels.length) where.levels = { hasSome: levels };
  if (regions.length) where.regions = { hasSome: regions };
  if (eduLevels.length) where.eduLevel = { in: eduLevels };
  if (university)
    where.university = { contains: university, mode: "insensitive" };
  if (gender === "MALE" || gender === "FEMALE") {
    where.user = { gender };
  }
  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    where.hourlyRate = {
      ...(Number.isNaN(min) ? {} : { gte: min }),
      ...(Number.isNaN(max) ? {} : { lte: max }),
    };
  }
  if (q) {
    where.OR = [
      { user: { name: { contains: q, mode: "insensitive" } } },
      { bio: { contains: q, mode: "insensitive" } },
    ];
  }

  // 推薦排序：最先顯示通過實名認證、無犯罪紀錄、學歷成績證明的老師,其次依評價
  const orderBy:
    | Prisma.TutorProfileOrderByWithRelationInput
    | Prisma.TutorProfileOrderByWithRelationInput[] =
    sort === "price_asc"
      ? { hourlyRate: "asc" }
      : sort === "price_desc"
        ? { hourlyRate: "desc" }
        : sort === "newest"
          ? { createdAt: "desc" }
          : sort === "rating"
            ? { ratingAvg: "desc" }
            : [
                { user: { idVerified: "desc" } },
                { user: { bgCheckVerified: "desc" } },
                { user: { eduVerified: "desc" } },
                { ratingAvg: "desc" },
                { ratingCount: "desc" },
              ];

  const [tutors, total] = await Promise.all([
    db.tutorProfile.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        bio: true,
        subjects: true,
        levels: true,
        regions: true,
        hourlyRate: true,
        mode: true,
        university: true,
        eduLevel: true,
        ratingAvg: true,
        ratingCount: true,
        user: {
          select: {
            name: true,
            displayName: true,
            avatarUrl: true,
            idVerified: true,
            bgCheckVerified: true,
            eduVerified: true,
          },
        },
      },
    }),
    db.tutorProfile.count({ where }),
  ]);

  // 目前使用者收藏的老師（用來顯示愛心狀態）
  const session = await auth();
  const favTutorIds = session
    ? new Set(
        (
          await db.favorite.findMany({
            where: { userId: session.user.id, tutorProfileId: { not: null } },
            select: { tutorProfileId: true },
          })
        ).map((f) => f.tutorProfileId)
      )
    : new Set<string | null>();

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // 分頁連結：保留目前查詢參數
  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    subjects.forEach((s) => params.append("subject", s));
    levels.forEach((l) => params.append("level", l));
    regions.forEach((r) => params.append("region", r));
    eduLevels.forEach((e) => params.append("edu", e));
    if (university) params.set("uni", university);
    if (!Number.isNaN(min)) params.set("min", String(min));
    if (!Number.isNaN(max)) params.set("max", String(max));
    if (gender) params.set("gender", gender);
    if (sort !== "recommended") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/tutors?${qs}` : "/tutors";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-4xl font-extrabold text-ink">找老師</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-3 text-sm font-bold text-ink/60">
        共 {total} 位老師符合條件
      </p>

      <div className="mt-6">
        <Suspense>
          <TutorFilters />
        </Suspense>
      </div>

      {tutors.length === 0 ? (
        <div className="mt-16 text-center font-bold text-ink/40">
          找不到符合條件的老師,試試調整篩選條件。
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((t) => (
            <TutorCard
              key={t.id}
              tutor={t}
              favorited={favTutorIds.has(t.id)}
            />
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
    </div>
  );
}
