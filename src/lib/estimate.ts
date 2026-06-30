// AI 行情估算（資料驅動）：以平台真實行情為基準，依老師條件加權，估算建議時薪。
// 純函式、可在伺服器與客戶端共用、結果完全可解釋。
// 平台樣本不足時，回退到「市場公開行情」基準（見 market-baseline.ts），而非寫死數字。

import { baselineRate } from "@/lib/market-baseline";

// 平台市場資料（由 stats 頁以真實老師時薪彙整而成）
export type MarketData = {
  cell: Record<string, number>; // `${subject}__${level}` -> 平均時薪
  bySubject: Record<string, number>; // 科目 -> 平均時薪
  byLevel: Record<string, number>; // 學制 -> 平均時薪
  overall: number; // 全站平均時薪
};

export type EstimateInput = {
  subjects: string[];
  levels: string[];
  experienceYears: number;
  eduLevel: string | null;
  // 帳號事實（影響加成，不可在試算中竄改）
  idVerified: boolean;
  bgCheckVerified: boolean;
  eduVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
};

export type EstimateFactor = {
  label: string;
  pct: number; // 加成比例，例如 +0.15 / -0.05
};

// 基準來源：platform=平台真實成交、baseline=市場公開行情、default=保底
export type BaseSource = "platform" | "baseline" | "default";

export type RateEstimate = {
  base: number; // 市場基準時薪
  low: number;
  mid: number; // 建議定價
  high: number;
  factors: EstimateFactor[];
  sampleCount: number; // 參與基準計算的市場樣本數（科目×學制格數）
  marketAvg: number; // 對應市場平均（用來比較）
  source: BaseSource;
};

const DEFAULT_RATE = 500; // 完全無市場資料時的保底基準

// 從自由文字的教學經歷解析年資（取第一個數字）
export function parseExperienceYears(text: string | null | undefined): number {
  if (!text) return 0;
  const m = text.match(/(\d+)/);
  return m ? Math.min(parseInt(m[1], 10), 50) : 0;
}

function round50(n: number): number {
  return Math.round(n / 50) * 50;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// 計算市場基準：優先用平台「科目×學制」真實均價，逐級放寬；
// 平台沒有對應資料時，回退到市場公開行情基準（而非寫死數字）。
function baseRate(
  input: EstimateInput,
  market: MarketData
): { base: number; sampleCount: number; marketAvg: number; source: BaseSource } {
  const cells: number[] = [];
  for (const s of input.subjects) {
    for (const l of input.levels) {
      const v = market.cell[`${s}__${l}`];
      if (v && v > 0) cells.push(v);
    }
  }
  if (cells.length) {
    const avg = cells.reduce((a, b) => a + b, 0) / cells.length;
    return { base: avg, sampleCount: cells.length, marketAvg: avg, source: "platform" };
  }
  // 退而求其次：平台科目均價
  const subjAvgs = input.subjects
    .map((s) => market.bySubject[s])
    .filter((v): v is number => !!v && v > 0);
  if (subjAvgs.length) {
    const avg = subjAvgs.reduce((a, b) => a + b, 0) / subjAvgs.length;
    return { base: avg, sampleCount: subjAvgs.length, marketAvg: avg, source: "platform" };
  }
  // 再退：平台學制均價
  const lvlAvgs = input.levels
    .map((l) => market.byLevel[l])
    .filter((v): v is number => !!v && v > 0);
  if (lvlAvgs.length) {
    const avg = lvlAvgs.reduce((a, b) => a + b, 0) / lvlAvgs.length;
    return { base: avg, sampleCount: lvlAvgs.length, marketAvg: avg, source: "platform" };
  }
  // 平台沒有資料 → 用市場公開行情基準（科目×學制）
  const baseCells: number[] = [];
  for (const s of input.subjects) {
    for (const l of input.levels) {
      const v = baselineRate(s, l);
      if (v > 0) baseCells.push(v);
    }
  }
  if (baseCells.length) {
    const avg = baseCells.reduce((a, b) => a + b, 0) / baseCells.length;
    return { base: avg, sampleCount: 0, marketAvg: avg, source: "baseline" };
  }
  // 最終保底
  return { base: DEFAULT_RATE, sampleCount: 0, marketAvg: DEFAULT_RATE, source: "default" };
}

function experienceFactor(years: number): EstimateFactor {
  if (years >= 10) return { label: `資深教學 ${years} 年`, pct: 0.25 };
  if (years >= 6) return { label: `教學經驗 ${years} 年`, pct: 0.15 };
  if (years >= 3) return { label: `教學經驗 ${years} 年`, pct: 0.08 };
  if (years >= 1) return { label: `教學經驗 ${years} 年`, pct: 0 };
  return { label: "尚無教學經驗", pct: -0.08 };
}

function eduFactor(eduLevel: string | null): EstimateFactor | null {
  if (!eduLevel) return null;
  if (eduLevel.includes("博士")) return { label: `${eduLevel}`, pct: 0.12 };
  if (eduLevel.includes("碩士")) return { label: `${eduLevel}`, pct: 0.06 };
  if (eduLevel.includes("高中")) return { label: `${eduLevel}`, pct: -0.05 };
  return null; // 學士／大學在學視為基準
}

/**
 * 主估算函式。回傳建議時薪區間與完整加成拆解。
 */
export function estimateRate(
  input: EstimateInput,
  market: MarketData
): RateEstimate {
  const { base, sampleCount, marketAvg, source } = baseRate(input, market);

  const factors: EstimateFactor[] = [];
  factors.push(experienceFactor(input.experienceYears));

  const edu = eduFactor(input.eduLevel);
  if (edu) factors.push(edu);

  const verCount =
    (input.idVerified ? 1 : 0) +
    (input.bgCheckVerified ? 1 : 0) +
    (input.eduVerified ? 1 : 0);
  if (verCount > 0) {
    factors.push({ label: `已完成 ${verCount} 項安全認證`, pct: 0.03 * verCount });
  }

  if (input.ratingCount >= 3) {
    if (input.ratingAvg >= 4.7)
      factors.push({ label: `頂尖口碑 ${input.ratingAvg.toFixed(1)}★`, pct: 0.1 });
    else if (input.ratingAvg >= 4.3)
      factors.push({ label: `良好口碑 ${input.ratingAvg.toFixed(1)}★`, pct: 0.05 });
    else if (input.ratingAvg < 3.5)
      factors.push({ label: `評價偏低 ${input.ratingAvg.toFixed(1)}★`, pct: -0.05 });
  }

  if (input.subjects.length >= 4) {
    factors.push({ label: "可教多科", pct: 0.03 });
  }

  const sumPct = clamp(
    factors.reduce((s, f) => s + f.pct, 0),
    -0.25,
    0.6
  );

  const mid = round50(base * (1 + sumPct));
  const low = round50(mid * 0.9);
  const high = round50(mid * 1.12);

  return {
    base: Math.round(base),
    low,
    mid,
    high,
    factors,
    sampleCount,
    marketAvg: Math.round(marketAvg),
    source,
  };
}
