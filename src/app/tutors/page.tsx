import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { expandRegions } from "@/lib/regions";
import TutorCard from "@/components/TutorCard";
import TutorFilters from "@/components/TutorFilters";
import { PAGE_SIZE } from "@/lib/constants";

export const metadata = {
  title: "找老師",
  description: "瀏覽 Tomo 上已發布的家教老師：科目、學制、地區、時薪與評價，一站比較與聯繫。",
  alternates: { canonical: "/tutors" },
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

// 收藏中的老師 id（顯示愛心狀態）
async function favoriteTutorIds() {
  const session = await auth();
  if (!session) return new Set<string | null>();
  const favs = await db.favorite.findMany({
    where: { userId: session.user.id, tutorProfileId: { not: null } },
    select: { tutorProfileId: true },
  });
  return new Set(favs.map((f) => f.tutorProfileId));
}

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-extrabold text-ink">找老師</h1>
          <div className="mt-2 h-1 w-14 bg-sun" />
          <p className="mt-3 text-sm font-bold text-ink/60">
            用科目、學制、地區、時薪等條件，篩選並比較老師。
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="shrink-0 rounded-full border border-line bg-sun px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-sun-dark"
        >
          發布需求 +
        </Link>
      </div>

      <BrowseMode sp={sp} />
    </div>
  );
}

// ── 篩選瀏覽 ─────────────────────────────────────────────
async function BrowseMode({
  sp,
}: {
  sp: Awaited<SearchParams>;
}) {
  const session = await auth();
  const me = session?.user.id;
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
  if (regions.length) where.regions = { hasSome: expandRegions(regions) };
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
        userId: true,
        bio: true,
        subjects: true,
        levels: true,
        regions: true,
        hourlyRate: true,
        hourlyRateMax: true,
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

  const favTutorIds = await favoriteTutorIds();
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // 區分「這組篩選沒結果」與「平台還沒有老師（冷啟動）」，空狀態給不同引導
  const hasFilters = Boolean(
    q ||
      subjects.length ||
      levels.length ||
      regions.length ||
      eduLevels.length ||
      university ||
      !Number.isNaN(min) ||
      !Number.isNaN(max) ||
      gender
  );

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
    <>
      <p className="mt-5 text-sm font-bold text-ink/60">
        共 {total} 位老師符合條件
      </p>

      <div className="mt-3">
        <Suspense>
          <TutorFilters />
        </Suspense>
      </div>

      {tutors.length === 0 ? (
        hasFilters ? (
          <div className="mt-16 text-center">
            <p className="font-bold text-ink/50">找不到符合條件的老師</p>
            <Link
              href="/tutors"
              className="mt-3 inline-block text-sm font-bold text-cobalt underline underline-offset-2 hover:text-ink"
            >
              清除篩選，看全部老師 →
            </Link>
          </div>
        ) : (
          <div className="mt-16 rounded-2xl border border-dashed border-line bg-paper/60 px-6 py-12 text-center">
            <p className="text-3xl">🌱</p>
            <p className="mt-3 text-lg font-bold text-ink">首批老師招募中</p>
            <p className="mt-2 text-sm font-medium text-ink/60">
              平台正在招募老師。先發布你的需求，老師上線後就能立刻媒合。
            </p>
            <Link
              href="/jobs/new"
              className="mt-6 inline-block rounded-full border border-line bg-sun px-6 py-2.5 text-sm font-bold text-paper transition hover:bg-sun-dark"
            >
              發布學習需求 +
            </Link>
          </div>
        )
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((t) => (
            <TutorCard
              key={t.id}
              tutor={t}
              favorited={favTutorIds.has(t.id)}
              mine={t.userId === me}
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
    </>
  );
}
