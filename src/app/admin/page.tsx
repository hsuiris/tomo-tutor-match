import { db } from "@/lib/db";

export const metadata = { title: "後台總覽 · TutorMatch" };

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "家長／學生",
  TUTOR: "老師",
  ADMIN: "管理員",
};
const JOB_LABEL: Record<string, string> = {
  OPEN: "徵求中",
  MATCHED: "已媒合",
  CLOSED: "已關閉",
};
const APP_LABEL: Record<string, string> = {
  PENDING: "待回覆",
  ACCEPTED: "已接受",
  REJECTED: "已婉拒",
};

// 取 n 天前的時間點。包成函式，避免在 render 直接呼叫 Date.now（react-hooks/purity）
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <div className="text-3xl font-extrabold text-ink">{value}</div>
      <div className="mt-1 text-sm font-bold text-ink/60">{label}</div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const since = daysAgo(7);
  const [
    usersByRole,
    jobsByStatus,
    appsByStatus,
    pendingVer,
    forumPosts,
    reviews,
    newUsers,
    newJobs,
    newApps,
  ] = await Promise.all([
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
    db.jobPost.groupBy({ by: ["status"], _count: { _all: true } }),
    db.application.groupBy({ by: ["status"], _count: { _all: true } }),
    db.verificationRequest.count({ where: { status: "PENDING" } }),
    db.forumPost.count(),
    db.review.count(),
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.jobPost.count({ where: { createdAt: { gte: since } } }),
    db.application.count({ where: { createdAt: { gte: since } } }),
  ]);

  const roleCount = (r: string) =>
    usersByRole.find((g) => g.role === r)?._count._all ?? 0;
  const jobCount = (s: string) =>
    jobsByStatus.find((g) => g.status === s)?._count._all ?? 0;
  const appCount = (s: string) =>
    appsByStatus.find((g) => g.status === s)?._count._all ?? 0;

  return (
    <div>
      <h1 className="font-serif text-3xl font-extrabold text-ink">後台總覽</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />

      <h2 className="mt-8 mb-3 text-sm font-bold text-ink/60">使用者</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.keys(ROLE_LABEL).map((r) => (
          <Stat key={r} label={ROLE_LABEL[r]} value={roleCount(r)} />
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold text-ink/60">案件</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.keys(JOB_LABEL).map((s) => (
          <Stat key={s} label={JOB_LABEL[s]} value={jobCount(s)} />
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold text-ink/60">應徵</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.keys(APP_LABEL).map((s) => (
          <Stat key={s} label={APP_LABEL[s]} value={appCount(s)} />
        ))}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold text-ink/60">內容與待辦</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="待審認證" value={pendingVer} />
        <Stat label="論壇文章" value={forumPosts} />
        <Stat label="評價" value={reviews} />
      </div>

      <h2 className="mt-8 mb-3 text-sm font-bold text-ink/60">近 7 日新增</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="新使用者" value={newUsers} />
        <Stat label="新案件" value={newJobs} />
        <Stat label="新應徵" value={newApps} />
      </div>
    </div>
  );
}
