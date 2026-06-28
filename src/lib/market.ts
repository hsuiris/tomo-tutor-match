// 行情彙總（純函式，不碰 DB）：給定老師與案件清單，算各維度時薪統計。
// admin 行情頁用；與 /stats 的公開估算（lib/estimate.ts）分工：這裡是描述性統計。

export type RateRow = {
  key: string;
  count: number;
  avg: number;
  min: number;
  max: number;
};

export type TutorLite = {
  hourlyRate: number | null;
  subjects: string[];
  levels: string[];
  regions: string[];
};

export type JobLite = { budget: number | null };

export type MarketBreakdown = {
  bySubject: RateRow[];
  byLevel: RateRow[];
  byRegion: RateRow[];
  supplyAvg: number; // 老師平均時薪
  demandAvg: number; // 家長平均預算
  tutorCount: number;
  jobCount: number;
};

// 一組時薪 → 統計列（空集合回 0）
export function rateRow(key: string, rates: number[]): RateRow {
  if (rates.length === 0) return { key, count: 0, avg: 0, min: 0, max: 0 };
  const sum = rates.reduce((a, b) => a + b, 0);
  return {
    key,
    count: rates.length,
    avg: Math.round(sum / rates.length),
    min: Math.min(...rates),
    max: Math.max(...rates),
  };
}

function nums(xs: (number | null)[]): number[] {
  return xs.filter((x): x is number => typeof x === "number" && x > 0);
}

export function aggregateMarket(
  tutors: TutorLite[],
  jobs: JobLite[],
  dims: {
    subjects: readonly string[];
    levels: readonly string[];
    regions: readonly string[];
  }
): MarketBreakdown {
  const rateOf = (pred: (t: TutorLite) => boolean) =>
    nums(tutors.filter(pred).map((t) => t.hourlyRate));

  const bySubject = dims.subjects
    .map((s) => rateRow(s, rateOf((t) => t.subjects.includes(s))))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avg - a.avg);

  const byLevel = dims.levels
    .map((l) => rateRow(l, rateOf((t) => t.levels.includes(l))))
    .filter((r) => r.count > 0);

  const byRegion = dims.regions
    .map((r) => rateRow(r, rateOf((t) => t.regions.includes(r))))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.avg - a.avg);

  const supply = nums(tutors.map((t) => t.hourlyRate));
  const demand = nums(jobs.map((j) => j.budget));

  return {
    bySubject,
    byLevel,
    byRegion,
    supplyAvg: rateRow("supply", supply).avg,
    demandAvg: rateRow("demand", demand).avg,
    tutorCount: tutors.length,
    jobCount: jobs.length,
  };
}
