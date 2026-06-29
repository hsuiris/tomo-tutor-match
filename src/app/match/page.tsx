import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import MatchForm from "@/components/MatchForm";
import MatchCard from "@/components/MatchCard";
import {
  rankTutors,
  type MatchCriteria,
  type MatchPriority,
  type MatchTutor,
} from "@/lib/match";
import { MATCH_PRIORITIES } from "@/lib/constants";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

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

export default async function MatchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const subject = str(sp.subject);
  const level = str(sp.level);
  const region = str(sp.region);
  const budgetNum = parseInt(str(sp.budget));
  const mode = str(sp.mode);
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
    mode: (mode as MatchCriteria["mode"]) || "",
    gender: (gender as MatchCriteria["gender"]) || "",
    priority,
  };

  const hasQuery = Boolean(subject || level || region || !Number.isNaN(budgetNum));

  const defaults = {
    subject,
    level,
    region,
    budget: Number.isNaN(budgetNum) ? "" : String(budgetNum),
    mode,
    gender,
    priority: priorityRaw,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-line bg-sun px-3 py-1 text-xs font-extrabold text-paper">
          ✨ 智能匹配
        </span>
      </div>
      <h1 className="mt-4 font-serif text-4xl font-extrabold text-ink">
        描述需求，我們幫你配對最適合的老師
      </h1>
      <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-ink/65">
        系統會依照科目、學制、地區、預算與你最在意的重點，計算每位老師的
        <span className="font-bold text-ink">契合度</span>
        ，並告訴你<span className="font-bold text-ink">為什麼推薦</span>。
      </p>

      <div className="mt-6">
        <MatchForm variant="full" defaults={defaults} />
      </div>

      {hasQuery ? (
        <MatchResults criteria={criteria} />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

async function MatchResults({ criteria }: { criteria: MatchCriteria }) {
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
    where,
    take: POOL_LIMIT,
    orderBy: { ratingAvg: "desc" },
    select: TUTOR_SELECT,
  })) as MatchTutor[];

  const ranked = rankTutors(pool, criteria, RESULT_LIMIT);

  // 收藏狀態
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
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl font-bold text-ink">
          為你推薦 {ranked.length} 位老師
        </h2>
        <Link
          href="/tutors"
          className="text-sm font-bold text-ink/50 underline underline-offset-2 hover:text-ink"
        >
          改用篩選搜尋 →
        </Link>
      </div>
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

function EmptyState() {
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
