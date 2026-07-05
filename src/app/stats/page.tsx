import { db } from "@/lib/db";
import { auth } from "@/auth";
import { SUBJECTS, ALL_LEVELS as LEVELS, SKILL_LEVELS } from "@/lib/constants";

const SKILL_LEVEL_SET = new Set<string>(SKILL_LEVELS);
import RateEstimator from "@/components/RateEstimator";
import { parseExperienceYears, type MarketData } from "@/lib/estimate";

export const metadata = { title: "家教行情統計" };

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

// 學制對應的主題色
const LEVEL_COLORS: Record<string, string> = {
  國小: "from-cyan-400 to-sky-400",
  國中: "from-sky-400 to-sky-500",
  高中: "from-blue-400 to-blue-500",
  大學: "from-blue-500 to-blue-600",
  成人: "from-blue-600 to-blue-700",
  // 技能類程度
  入門: "from-emerald-400 to-teal-400",
  初階: "from-teal-400 to-teal-500",
  進階: "from-teal-500 to-teal-600",
};

export default async function StatsPage() {
  const tutors = await db.tutorProfile.findMany({
    where: { isPublished: true, hourlyRate: { not: null } },
    select: { hourlyRate: true, subjects: true, levels: true },
  });
  const jobs = await db.jobPost.findMany({
    where: { budget: { not: null } },
    select: { budget: true, subject: true, level: true },
  });

  const byLevel = LEVELS.map((level) => {
    const rates = tutors
      .filter((t) => t.levels.includes(level))
      .map((t) => t.hourlyRate as number);
    const budgets = jobs
      .filter((j) => j.level === level)
      .map((j) => j.budget as number);
    return {
      level,
      count: rates.length,
      avg: avg(rates),
      min: rates.length ? Math.min(...rates) : 0,
      max: rates.length ? Math.max(...rates) : 0,
      demandAvg: avg(budgets),
    };
  })
    // 技能類程度（入門/初階/進階）沒資料時不顯示，避免空卡片；學術年級維持常駐
    .filter((l) => !SKILL_LEVEL_SET.has(l.level) || l.count > 0);

  const bySubject = SUBJECTS.map((subject) => {
    const rates = tutors
      .filter((t) => t.subjects.includes(subject))
      .map((t) => t.hourlyRate as number);
    return {
      subject,
      count: rates.length,
      avg: avg(rates),
      min: rates.length ? Math.min(...rates) : 0,
      max: rates.length ? Math.max(...rates) : 0,
    };
  })
    .filter((s) => s.count > 0)
    .sort((a, b) => b.avg - a.avg);

  const matrixSubjects = SUBJECTS.filter((subject) =>
    tutors.some((t) => t.subjects.includes(subject))
  );
  function cellAvg(subject: string, level: string): number {
    return avg(
      tutors
        .filter((t) => t.subjects.includes(subject) && t.levels.includes(level))
        .map((t) => t.hourlyRate as number)
    );
  }
  // 熱力圖色階範圍
  const allCells = matrixSubjects.flatMap((s) =>
    LEVELS.map((l) => cellAvg(s, l)).filter((v) => v > 0)
  );
  const cellMin = allCells.length ? Math.min(...allCells) : 0;
  const cellMax = allCells.length ? Math.max(...allCells) : 1;
  function heat(v: number): string {
    if (!v) return "transparent";
    const t = cellMax === cellMin ? 0.5 : (v - cellMin) / (cellMax - cellMin);
    // 淺 → 深 鼠尾草綠
    return `rgba(125, 154, 91, ${0.15 + t * 0.7})`;
  }

  // 組市場資料給 AI 行情估算（以真實老師時薪彙整）
  const market: MarketData = {
    cell: {},
    bySubject: {},
    byLevel: {},
    overall: avg(tutors.map((t) => t.hourlyRate as number)),
  };
  for (const s of SUBJECTS) {
    for (const l of LEVELS) {
      const v = cellAvg(s, l);
      if (v > 0) market.cell[`${s}__${l}`] = v;
    }
    const sv = avg(
      tutors.filter((t) => t.subjects.includes(s)).map((t) => t.hourlyRate as number)
    );
    if (sv > 0) market.bySubject[s] = sv;
  }
  for (const l of LEVELS) {
    const lv = avg(
      tutors.filter((t) => t.levels.includes(l)).map((t) => t.hourlyRate as number)
    );
    if (lv > 0) market.byLevel[l] = lv;
  }

  // 僅老師帳號：取自己的檔案做估算
  const session = await auth();
  const myProfile =
    session?.user?.role === "TUTOR"
      ? await db.tutorProfile.findUnique({
          where: { userId: session.user.id },
          select: {
            subjects: true,
            levels: true,
            experience: true,
            eduLevel: true,
            hourlyRate: true,
            ratingAvg: true,
            ratingCount: true,
            user: {
              select: {
                idVerified: true,
                bgCheckVerified: true,
                eduVerified: true,
              },
            },
          },
        })
      : null;

  const totalTutors = await db.tutorProfile.count({
    where: { isPublished: true },
  });
  const totalJobs = await db.jobPost.count({ where: { status: "OPEN" } });
  const verifiedTutors = await db.user.count({
    where: { role: "TUTOR", idVerified: true },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      {/* Hero：柔暖漸層 */}
      <div className="rounded-3xl border border-line bg-gradient-to-br from-sun-soft via-paper to-blushbg px-6 py-12 shadow-card sm:px-12">
        <h1 className="font-serif text-4xl font-extrabold text-ink sm:text-5xl">
          家教行情統計
        </h1>
        <p className="mt-3 max-w-xl font-medium text-ink/75">
          收費會因學制與科目而不同。以下依各維度分別統計,讓市場行情一目了然。
        </p>
        <div className="mt-8 grid grid-cols-3 gap-4">
          <HeroStat value={totalTutors} label="公開老師" />
          <HeroStat value={totalJobs} label="徵求中案件" />
          <HeroStat value={verifiedTutors} label="實名認證老師" />
        </div>
      </div>

      {/* AI 行情估算（僅老師可見） */}
      {myProfile && (
        <div className="mt-6">
          <RateEstimator
            market={market}
            defaults={{
              subjects: myProfile.subjects,
              levels: myProfile.levels,
              experienceYears: parseExperienceYears(myProfile.experience),
              eduLevel: myProfile.eduLevel,
            }}
            account={{
              idVerified: myProfile.user.idVerified,
              bgCheckVerified: myProfile.user.bgCheckVerified,
              eduVerified: myProfile.user.eduVerified,
              ratingAvg: myProfile.ratingAvg,
              ratingCount: myProfile.ratingCount,
              currentRate: myProfile.hourlyRate,
            }}
          />
        </div>
      )}

      <div className="py-10">
        {/* 依學制 */}
        <h2 className="mb-4 font-serif font-serif text-3xl font-extrabold text-ink">
          依學制（年級）平均時薪
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {byLevel.map((l) => (
            <div
              key={l.level}
              className="overflow-hidden rounded-xl border border-line bg-paper"
            >
              <div
                className={`bg-gradient-to-br ${
                  LEVEL_COLORS[l.level] ?? "from-ink/40 to-ink/50"
                } px-4 py-3 text-paper`}
              >
                <div className="text-sm opacity-90">{l.level}</div>
                <div className="text-2xl font-bold">
                  {l.avg ? `$${l.avg}` : "—"}
                </div>
              </div>
              <div className="space-y-0.5 px-4 py-3 text-xs text-ink/60">
                {l.count > 0 ? (
                  <>
                    <div>
                      範圍 ${l.min}–${l.max}
                    </div>
                    <div>{l.count} 位老師</div>
                  </>
                ) : (
                  <div>尚無老師</div>
                )}
                {l.demandAvg > 0 && (
                  <div className="text-cobalt">學生開價 ${l.demandAvg}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 依科目排行 */}
        <h2 className="mb-4 mt-10 font-serif font-serif text-3xl font-extrabold text-ink">
          科目平均時薪排行
        </h2>
        <div className="overflow-hidden rounded-xl border border-line bg-paper">
          {bySubject.map((s, i) => (
            <div
              key={s.subject}
              className="flex items-center gap-3 border-b border-line/10 px-4 py-3 last:border-0"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-sm font-bold ${
                  i < 3 ? "bg-sun text-paper" : "bg-paper text-ink/50"
                }`}
              >
                {i + 1}
              </span>
              <span className="flex-1 font-bold text-ink">{s.subject}</span>
              <span className="text-xs text-ink/40">
                ${s.min}–${s.max} ・ {s.count} 位
              </span>
              <span className="w-16 text-right font-serif text-lg font-bold text-ink">
                ${s.avg}
              </span>
            </div>
          ))}
          {bySubject.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-ink/40">
              尚無資料
            </p>
          )}
        </div>

        {/* 科目 × 學制 熱力圖 */}
        <h2 className="mb-1 mt-10 font-serif font-serif text-3xl font-extrabold text-ink">
          科目 × 學制 平均時薪
        </h2>
        <p className="mb-4 text-xs text-ink/40">顏色越深代表時薪越高</p>
        <div className="overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-ink/60">
                <th className="sticky left-0 bg-paper px-3 py-2 text-left font-medium">
                  科目
                </th>
                {LEVELS.map((lv) => (
                  <th key={lv} className="px-2 py-2 text-center font-medium">
                    {lv}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixSubjects.map((subject) => (
                <tr key={subject}>
                  <td className="sticky left-0 bg-paper px-3 py-2 font-medium text-ink/70">
                    {subject}
                  </td>
                  {LEVELS.map((lv) => {
                    const v = cellAvg(subject, lv);
                    return (
                      <td
                        key={lv}
                        className="px-2 py-2 text-center text-xs font-medium"
                        style={{
                          backgroundColor: heat(v),
                          color: v ? "#1e293b" : "#cbd5e1",
                        }}
                      >
                        {v ? `$${v}` : "·"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {matrixSubjects.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-ink/40">
              尚無資料
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper px-4 py-3">
      <div className="font-serif font-serif text-3xl font-extrabold text-ink">{value}</div>
      <div className="text-xs font-bold text-ink/60">{label}</div>
    </div>
  );
}
