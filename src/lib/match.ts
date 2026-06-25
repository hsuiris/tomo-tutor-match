// 智能匹配：規則式加權配對引擎
//
// 設計理念：使用者描述需求（科目／學制／地區／預算／授課方式／在意的重點），
// 引擎針對每位候選老師計算「契合度 %」並產生「為什麼推薦」的理由。
// 純函式、無 AI、無外部依賴 —— 可單元測試、結果可解釋、零延遲。

import type { TeachingMode } from "@/lib/constants";

// 學生輸入的配對條件
export type MatchCriteria = {
  subject?: string; // 主要科目
  level?: string; // 學制／年級
  region?: string; // 地區（含「線上」）
  budget?: number; // 可接受的每小時上限（NT$）
  mode?: TeachingMode | ""; // 偏好授課方式
  gender?: "MALE" | "FEMALE" | ""; // 老師性別偏好
  priority?: MatchPriority; // 最在意的重點 → 動態調整權重
};

export type MatchPriority =
  | "balanced" // 綜合最佳
  | "budget" // 預算優先
  | "rating" // 評價優先
  | "credentials"; // 學歷／認證優先

// 配對所需的老師欄位（為 Prisma select 的子集）
export type MatchTutor = {
  id: string;
  bio: string | null;
  subjects: string[];
  levels: string[];
  regions: string[];
  hourlyRate: number | null;
  mode: TeachingMode;
  university: string | null;
  eduLevel: string | null;
  experience: string | null;
  ratingAvg: number;
  ratingCount: number;
  user: {
    id: string;
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
    gender: "MALE" | "FEMALE" | "UNDISCLOSED";
    idVerified: boolean;
    bgCheckVerified: boolean;
    eduVerified: boolean;
  };
};

export type MatchReason = { label: string; positive: boolean };

export type ScoredTutor = {
  tutor: MatchTutor;
  score: number; // 0–100 契合度
  reasons: MatchReason[]; // 推薦理由（正向）與提醒（負向）
};

// 單一評分維度
type Dimension = {
  key: string;
  weight: number; // 權重
  fitness: number; // 0–1 契合程度
  active: boolean; // 是否納入計算（未填的條件不計入）
  reason?: MatchReason;
};

// 各維度的基準權重；總和不必為 100，最後會以「有效維度」正規化
const BASE_WEIGHTS = {
  subject: 30,
  level: 12,
  region: 16,
  budget: 14,
  rating: 16,
  trust: 8,
  gender: 4,
} as const;

// 依使用者最在意的重點放大對應維度的權重
function weightFor(key: keyof typeof BASE_WEIGHTS, priority: MatchPriority): number {
  const base = BASE_WEIGHTS[key];
  switch (priority) {
    case "budget":
      return key === "budget" ? base * 2.6 : base;
    case "rating":
      return key === "rating" ? base * 2.4 : base;
    case "credentials":
      return key === "trust" ? base * 3 : base;
    default:
      return base;
  }
}

function trustScore(u: MatchTutor["user"]): number {
  return (
    (u.idVerified ? 1 : 0) +
    (u.bgCheckVerified ? 1 : 0) +
    (u.eduVerified ? 1 : 0)
  ) / 3;
}

function trustLabel(u: MatchTutor["user"]): string {
  const got: string[] = [];
  if (u.idVerified) got.push("實名");
  if (u.bgCheckVerified) got.push("良民證");
  if (u.eduVerified) got.push("學歷");
  return got.join("・");
}

/**
 * 計算單一老師對某組條件的契合度與理由。
 */
export function scoreTutor(
  tutor: MatchTutor,
  criteria: MatchCriteria
): ScoredTutor {
  const priority = criteria.priority ?? "balanced";
  const dims: Dimension[] = [];

  // 1. 科目
  if (criteria.subject) {
    const hit = tutor.subjects.includes(criteria.subject);
    dims.push({
      key: "subject",
      weight: weightFor("subject", priority),
      fitness: hit ? 1 : 0,
      active: true,
      reason: hit
        ? { label: `教授「${criteria.subject}」`, positive: true }
        : { label: `未教授「${criteria.subject}」`, positive: false },
    });
  }

  // 2. 學制
  if (criteria.level) {
    const hit = tutor.levels.includes(criteria.level);
    dims.push({
      key: "level",
      weight: weightFor("level", priority),
      fitness: hit ? 1 : 0.2,
      active: true,
      reason: hit
        ? { label: `可教 ${criteria.level}`, positive: true }
        : undefined,
    });
  }

  // 3. 地區 / 授課方式
  if (criteria.region) {
    const wantsOnline = criteria.region === "線上";
    const teachesOnline =
      tutor.mode === "ONLINE" || tutor.mode === "BOTH" || tutor.regions.includes("線上");
    let fitness: number;
    let reason: MatchReason | undefined;
    if (wantsOnline) {
      fitness = teachesOnline ? 1 : 0;
      if (teachesOnline) reason = { label: "提供線上授課", positive: true };
    } else if (tutor.regions.includes(criteria.region)) {
      fitness = 1;
      reason = { label: `可在 ${criteria.region} 授課`, positive: true };
    } else if (teachesOnline) {
      fitness = 0.5; // 雖不在當地，但可線上替代
      reason = { label: "可改線上授課", positive: true };
    } else {
      fitness = 0;
      reason = { label: `不在 ${criteria.region}`, positive: false };
    }
    dims.push({ key: "region", weight: weightFor("region", priority), fitness, active: true, reason });
  }

  // 4. 預算（每小時上限）
  if (criteria.budget && criteria.budget > 0) {
    const rate = tutor.hourlyRate;
    let fitness: number;
    let reason: MatchReason | undefined;
    if (rate == null) {
      fitness = 0.5; // 未標價，中性
    } else if (rate <= criteria.budget) {
      fitness = 1;
      reason = { label: `NT$${rate}／時 在預算內`, positive: true };
    } else if (rate <= criteria.budget * 1.15) {
      fitness = 0.55;
      reason = { label: `NT$${rate}／時 略高於預算`, positive: false };
    } else if (rate <= criteria.budget * 1.3) {
      fitness = 0.25;
      reason = { label: `NT$${rate}／時 高於預算`, positive: false };
    } else {
      fitness = 0;
      reason = { label: `NT$${rate}／時 超出預算`, positive: false };
    }
    dims.push({ key: "budget", weight: weightFor("budget", priority), fitness, active: true, reason });
  }

  // 5. 評價（含可信度：評論數越少越保守）
  {
    const hasReviews = tutor.ratingCount > 0;
    const confidence = Math.min(tutor.ratingCount / 5, 1);
    // 新老師（無評論）給中性 0.6，避免被完全淹沒
    const fitness = hasReviews
      ? (tutor.ratingAvg / 5) * confidence + 0.6 * (1 - confidence)
      : 0.6;
    let reason: MatchReason | undefined;
    if (hasReviews && tutor.ratingAvg >= 4.5) {
      reason = {
        label: `${tutor.ratingAvg.toFixed(1)}★ 高評價（${tutor.ratingCount} 則）`,
        positive: true,
      };
    } else if (!hasReviews) {
      reason = { label: "新加入老師", positive: true };
    }
    dims.push({ key: "rating", weight: weightFor("rating", priority), fitness, active: true, reason });
  }

  // 6. 安全認證
  {
    const t = trustScore(tutor.user);
    dims.push({
      key: "trust",
      weight: weightFor("trust", priority),
      fitness: t,
      active: true,
      reason:
        t >= 0.66
          ? { label: `已通過 ${trustLabel(tutor.user)} 認證`, positive: true }
          : undefined,
    });
  }

  // 7. 性別偏好（有填才計入）
  if (criteria.gender === "MALE" || criteria.gender === "FEMALE") {
    const hit = tutor.user.gender === criteria.gender;
    dims.push({
      key: "gender",
      weight: weightFor("gender", priority),
      fitness: hit ? 1 : 0,
      active: true,
      reason: hit
        ? { label: criteria.gender === "MALE" ? "男老師" : "女老師", positive: true }
        : undefined,
    });
  }

  // 正規化加權平均（只算有效維度）
  const active = dims.filter((d) => d.active);
  const totalWeight = active.reduce((s, d) => s + d.weight, 0) || 1;
  const raw = active.reduce((s, d) => s + d.weight * d.fitness, 0) / totalWeight;
  const score = Math.round(raw * 100);

  // 理由：正向優先（依權重排序）、最多保留一個提醒
  const sorted = [...dims].sort((a, b) => b.weight - a.weight);
  const positives = sorted.filter((d) => d.reason?.positive).map((d) => d.reason!);
  const negatives = sorted.filter((d) => d.reason && !d.reason.positive).map((d) => d.reason!);
  const reasons = [...positives.slice(0, 4), ...negatives.slice(0, 1)];

  return { tutor, score, reasons };
}

/**
 * 對一組候選老師排序，回傳契合度由高到低的清單。
 * @param limit 取前幾名（預設全部）
 */
export function rankTutors(
  tutors: MatchTutor[],
  criteria: MatchCriteria,
  limit?: number
): ScoredTutor[] {
  const scored = tutors
    .map((t) => scoreTutor(t, criteria))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // 同分時：評價高者優先，再來評論多者
      if (b.tutor.ratingAvg !== a.tutor.ratingAvg)
        return b.tutor.ratingAvg - a.tutor.ratingAvg;
      return b.tutor.ratingCount - a.tutor.ratingCount;
    });
  return typeof limit === "number" ? scored.slice(0, limit) : scored;
}

// 契合度 → 等級標籤與配色（給 UI 用）
export function matchTier(score: number): { label: string; tone: "high" | "mid" | "low" } {
  if (score >= 80) return { label: "非常契合", tone: "high" };
  if (score >= 60) return { label: "頗為契合", tone: "mid" };
  return { label: "部分契合", tone: "low" };
}

// ─────────────────────────────────────────────────────────────
// 反向匹配：以「老師自己的檔案」為基準，替老師找最適合接的家教需求
// ─────────────────────────────────────────────────────────────

// 老師檔案（評分基準）
export type JobMatchProfile = {
  subjects: string[];
  levels: string[];
  regions: string[];
  hourlyRate: number | null;
  mode: TeachingMode;
};

// 配對所需的職缺欄位（為 Prisma select 的子集）
export type MatchJob = {
  id: string;
  title: string;
  subject: string;
  level: string | null;
  region: string;
  mode: TeachingMode;
  budget: number | null;
  status: "OPEN" | "MATCHED" | "CLOSED";
  studentStatus: string | null;
  parentNeeds: string | null;
  createdAt: Date;
  student: { name: string };
  _count: { applications: number };
};

export type ScoredJob = {
  job: MatchJob;
  score: number;
  reasons: MatchReason[];
};

const JOB_WEIGHTS = {
  subject: 32,
  region: 18,
  budget: 18,
  level: 12,
  competition: 12, // 應徵人數少 → 機會大
  recency: 8, // 越新越值得把握
} as const;

function daysSince(d: Date): number {
  return (Date.now() - new Date(d).getTime()) / 86_400_000;
}

/**
 * 以老師檔案計算某筆家教需求的契合度與理由。
 */
export function scoreJob(job: MatchJob, profile: JobMatchProfile): ScoredJob {
  const dims: Dimension[] = [];

  // 1. 科目是否為老師專長
  {
    const hit = profile.subjects.includes(job.subject);
    dims.push({
      key: "subject",
      weight: JOB_WEIGHTS.subject,
      fitness: hit ? 1 : 0,
      active: true,
      reason: hit
        ? { label: `符合你的專長「${job.subject}」`, positive: true }
        : { label: `非你登記的科目「${job.subject}」`, positive: false },
    });
  }

  // 2. 地區 / 授課方式
  {
    const wantsOnline = job.region === "線上";
    const teachesOnline =
      profile.mode === "ONLINE" ||
      profile.mode === "BOTH" ||
      profile.regions.includes("線上");
    let fitness: number;
    let reason: MatchReason | undefined;
    if (wantsOnline) {
      fitness = teachesOnline ? 1 : 0;
      if (teachesOnline) reason = { label: "可線上授課", positive: true };
      else reason = { label: "對方要線上、你未提供", positive: false };
    } else if (profile.regions.includes(job.region)) {
      fitness = 1;
      reason = { label: `在你的授課地區 ${job.region}`, positive: true };
    } else if (teachesOnline) {
      fitness = 0.5;
      reason = { label: "可改線上授課", positive: true };
    } else {
      fitness = 0;
      reason = { label: `不在你的授課地區（${job.region}）`, positive: false };
    }
    dims.push({ key: "region", weight: JOB_WEIGHTS.region, fitness, active: true, reason });
  }

  // 3. 預算是否達到老師的時薪
  {
    const rate = profile.hourlyRate;
    let fitness: number;
    let reason: MatchReason | undefined;
    if (job.budget == null) {
      fitness = 0.6; // 面議，中性
      reason = { label: "預算面議", positive: true };
    } else if (rate == null) {
      fitness = 0.6;
    } else if (job.budget >= rate) {
      fitness = 1;
      reason = { label: `預算 NT$${job.budget} ≥ 你的時薪`, positive: true };
    } else if (job.budget >= rate * 0.9) {
      fitness = 0.6;
      reason = { label: `預算略低於你的時薪`, positive: false };
    } else if (job.budget >= rate * 0.8) {
      fitness = 0.3;
      reason = { label: `預算 NT$${job.budget} 低於你的時薪`, positive: false };
    } else {
      fitness = 0;
      reason = { label: `預算 NT$${job.budget} 遠低於你的時薪`, positive: false };
    }
    dims.push({ key: "budget", weight: JOB_WEIGHTS.budget, fitness, active: true, reason });
  }

  // 4. 學制
  if (job.level) {
    const hit = profile.levels.includes(job.level);
    dims.push({
      key: "level",
      weight: JOB_WEIGHTS.level,
      fitness: hit ? 1 : 0.2,
      active: true,
      reason: hit ? { label: `你可教 ${job.level}`, positive: true } : undefined,
    });
  }

  // 5. 競爭程度（應徵人數越少越好）
  {
    const apps = job._count.applications;
    const fitness =
      apps === 0 ? 1 : apps <= 2 ? 0.8 : apps <= 5 ? 0.5 : apps <= 9 ? 0.3 : 0.15;
    let reason: MatchReason | undefined;
    if (apps === 0) reason = { label: "尚無人應徵，先搶先贏", positive: true };
    else if (apps <= 2) reason = { label: `僅 ${apps} 人應徵，機會大`, positive: true };
    else if (apps >= 10) reason = { label: `${apps} 人應徵，競爭激烈`, positive: false };
    dims.push({ key: "competition", weight: JOB_WEIGHTS.competition, fitness, active: true, reason });
  }

  // 6. 新鮮度
  {
    const d = daysSince(job.createdAt);
    const fitness = d <= 1 ? 1 : d <= 3 ? 0.8 : d <= 7 ? 0.6 : d <= 30 ? 0.4 : 0.2;
    const reason: MatchReason | undefined =
      d <= 1 ? { label: "今天剛發布", positive: true } : undefined;
    dims.push({ key: "recency", weight: JOB_WEIGHTS.recency, fitness, active: true, reason });
  }

  const active = dims.filter((d) => d.active);
  const totalWeight = active.reduce((s, d) => s + d.weight, 0) || 1;
  const raw = active.reduce((s, d) => s + d.weight * d.fitness, 0) / totalWeight;
  const score = Math.round(raw * 100);

  const sorted = [...dims].sort((a, b) => b.weight - a.weight);
  const positives = sorted.filter((d) => d.reason?.positive).map((d) => d.reason!);
  const negatives = sorted.filter((d) => d.reason && !d.reason.positive).map((d) => d.reason!);
  const reasons = [...positives.slice(0, 4), ...negatives.slice(0, 1)];

  return { job, score, reasons };
}

/**
 * 替老師排序家教需求，契合度高到低。
 */
export function rankJobs(
  jobs: MatchJob[],
  profile: JobMatchProfile,
  limit?: number
): ScoredJob[] {
  const scored = jobs
    .map((j) => scoreJob(j, profile))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // 同分時：新發布的優先
      return new Date(b.job.createdAt).getTime() - new Date(a.job.createdAt).getTime();
    });
  return typeof limit === "number" ? scored.slice(0, limit) : scored;
}
