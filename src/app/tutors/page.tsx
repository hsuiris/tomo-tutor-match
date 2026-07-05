import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { expandRegions } from "@/lib/regions";
import TutorCard from "@/components/TutorCard";
import TutorFilters from "@/components/TutorFilters";
import MatchForm from "@/components/MatchForm";
import MatchCard from "@/components/MatchCard";
import ModeTabs from "@/components/ModeTabs";
import { PAGE_SIZE, MATCH_PRIORITIES } from "@/lib/constants";
import {
  rankTutors,
  type MatchCriteria,
  type MatchPriority,
  type MatchTutor,
} from "@/lib/match";

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
  const isMatch = str(sp.view) === "match";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-extrabold text-ink">找老師</h1>
          <div className="mt-2 h-1 w-14 bg-sun" />
          <p className="mt-3 text-sm font-bold text-ink/60">
            用條件篩選，或讓系統依你在意的重點智能配對。
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="shrink-0 rounded-full border border-line bg-sun px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-sun-dark"
        >
          發布需求 +
        </Link>
      </div>

      <div className="mt-6">
        <ModeTabs
          base="/tutors"
          active={isMatch ? "match" : "browse"}
          browseLabel="篩選瀏覽"
          matchLabel="✨ 智能配對"
        />
      </div>

      {isMatch ? <MatchMode sp={sp} /> : <BrowseMode sp={sp} />}
    </div>
  );
}

// ── 篩選瀏覽 ─────────────────────────────────────────────
async function BrowseMode({
  sp,
}: {
  sp: Awaited<SearchParams>;
}) {
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
        <div className="mt-16 text-center font-bold text-ink/40">
          找不到符合條件的老師,試試調整篩選條件。
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tutors.map((t) => (
            <TutorCard key={t.id} tutor={t} favorited={favTutorIds.has(t.id)} />
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

// ── 智能配對 ─────────────────────────────────────────────
const RESULT_LIMIT = 12;
const POOL_LIMIT = 80; // 評分前先抓進記憶體的候選上限

// 配對需要的老師欄位
const TUTOR_SELECT = {
  id: true,
  bio: true,
  subjects: true,
  levels: true,
  regions: true,
  hourlyRate: true,
  hourlyRateMax: true,
  mode: true,
  university: true,
  eduLevel: true,
  experience: true,
  ratingAvg: true,
  ratingCount: true,
  user: {
    select: {
      id: true,
      name: true,
      displayName: true,
      avatarUrl: true,
      gender: true,
      idVerified: true,
      bgCheckVerified: true,
      eduVerified: true,
    },
  },
} satisfies Prisma.TutorProfileSelect;

async function MatchMode({ sp }: { sp: Awaited<SearchParams> }) {
  const subject = str(sp.subject);
  const level = str(sp.level);
  const region = str(sp.region);
  const budgetNum = parseInt(str(sp.budget));
  const teachMode = str(sp.mode); // 授課方式（頁面模式用 view 參數，不衝突）
  const gender = str(sp.gender);
  const priorityRaw = str(sp.priority) || "balanced";
  const priority = (MATCH_PRIORITIES.some((p) => p.value === priorityRaw)
    ? priorityRaw
    : "balanced") as MatchPriority;

  const criteria: MatchCriteria = {
    subject: subject || undefined,
    level: level || undefined,
    region: region || undefined,
    budget: Number.isNaN(budgetNum) ? undefined : budgetNum,
    mode: (teachMode as MatchCriteria["mode"]) || "",
    gender: (gender as MatchCriteria["gender"]) || "",
    priority,
  };

  const hasQuery = Boolean(
    subject || level || region || !Number.isNaN(budgetNum)
  );

  const defaults = {
    subject,
    level,
    region,
    budget: Number.isNaN(budgetNum) ? "" : String(budgetNum),
    mode: teachMode,
    gender,
    priority: priorityRaw,
  };

  return (
    <>
      <p className="mt-5 max-w-2xl text-sm font-medium leading-relaxed text-ink/65">
        依科目、學制、地區、預算與你最在意的重點，計算每位老師的
        <span className="font-bold text-ink">契合度</span>，並告訴你
        <span className="font-bold text-ink">為什麼推薦</span>。
      </p>

      <div className="mt-4">
        <MatchForm variant="full" defaults={defaults} />
      </div>

      {hasQuery ? <MatchResults criteria={criteria} /> : <MatchEmptyState />}
    </>
  );
}

async function MatchResults({ criteria }: { criteria: MatchCriteria }) {
  // 排除自己的老師檔案（自己不能洽談自己）
  const session = await auth();
  const me = session?.user.id;
  // 先以科目縮小候選；若科目沒有任何老師則放寬（讓評分挑出相近的）
  let where: Prisma.TutorProfileWhereInput = { isPublished: true };
  let broadened = false;
  if (criteria.subject) {
    const count = await db.tutorProfile.count({
      where: { isPublished: true, subjects: { has: criteria.subject } },
    });
    if (count > 0) {
      where = { isPublished: true, subjects: { has: criteria.subject } };
    } else {
      broadened = true;
    }
  }

  const pool = (await db.tutorProfile.findMany({
    where: { ...where, ...(me ? { userId: { not: me } } : {}) },
    take: POOL_LIMIT,
    orderBy: { ratingAvg: "desc" },
    select: TUTOR_SELECT,
  })) as MatchTutor[];

  const ranked = rankTutors(pool, criteria, RESULT_LIMIT);
  const favTutorIds = await favoriteTutorIds();

  if (ranked.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-line bg-paper p-10 text-center">
        <p className="text-lg font-bold text-ink">目前沒有符合的老師</p>
        <p className="mt-2 text-sm text-ink/60">
          試著放寬預算或地區，或
          <Link href="/tutors" className="font-bold text-cobalt underline">
            瀏覽全部老師
          </Link>
          。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="font-serif text-2xl font-bold text-ink">
        為你推薦 {ranked.length} 位老師
      </h2>
      {broadened && (
        <p className="mt-2 rounded-xl border border-dashed border-line/20 bg-blushbg/50 px-4 py-2 text-sm font-bold text-ink/70">
          目前沒有完全教授「{criteria.subject}」的老師，以下為條件相近的推薦。
        </p>
      )}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {ranked.map((r, i) => (
          <MatchCard
            key={r.tutor.id}
            result={r}
            rank={i + 1}
            favorited={favTutorIds.has(r.tutor.id)}
          />
        ))}
      </div>
    </div>
  );
}

function MatchEmptyState() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      {[
        { icon: "📝", title: "描述需求", desc: "選科目、學制、地區與預算，再挑你最在意的重點。" },
        { icon: "🎯", title: "契合度排序", desc: "系統算出每位老師的契合度，由高到低排列。" },
        { icon: "💬", title: "直接洽談", desc: "看到合適的老師，一鍵發起預約洽談。" },
      ].map((s) => (
        <div key={s.title} className="rounded-2xl border border-line bg-paper p-6">
          <div className="text-3xl">{s.icon}</div>
          <h3 className="mt-3 font-serif text-lg font-bold text-ink">{s.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/65">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}
