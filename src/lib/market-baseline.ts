// 市場公開行情基準（台灣，2026）
// 平台自身樣本不足時的回退基準，讓估算貼近真實市場，而非一個寫死的數字。
// 資料來源：104 職場力家教行情、pro360 家教費用、AmazingTalker 鐘點費整理。
//   - 國小核心科目 ~NT$400、國中 ~NT$550、高中 ~NT$800/時
//   - 大學課業 / 成人 ~NT$720–750/時（專業科目可更高）
//   - 才藝（鋼琴/美術）約與核心相當；程式設計為稀缺溢價；伴讀偏低
// 模型：各學制基準 × 科目係數。數字為「典型中位」，估算時再依老師條件加權。

// 各學制的核心科目基準時薪（NT$/時）
export const LEVEL_BASE: Record<string, number> = {
  國小: 400,
  國中: 550,
  高中: 800,
  大學: 720,
  成人: 750,
};
const DEFAULT_LEVEL_BASE = 600;

// 科目相對係數（相對該學制核心科目）
export const SUBJECT_MULT: Record<string, number> = {
  數學: 1.05,
  物理: 1.05,
  化學: 1.05,
  生物: 1.0,
  英文: 1.0,
  國文: 0.92,
  地理: 0.92,
  歷史: 0.92,
  會計: 1.05,
  經濟: 1.05,
  程式設計: 1.4, // 稀缺、需求高
  日文: 1.1,
  鋼琴: 1.0,
  美術: 1.0,
  伴讀: 0.65, // 陪讀／作業輔導，低於正式授課
};
const DEFAULT_SUBJECT_MULT = 1.0;

// 單一科目×學制的市場基準時薪（四捨五入到 50）
export function baselineRate(subject: string, level: string): number {
  const lb = LEVEL_BASE[level] ?? DEFAULT_LEVEL_BASE;
  const m = SUBJECT_MULT[subject] ?? DEFAULT_SUBJECT_MULT;
  return Math.round((lb * m) / 50) * 50;
}

// demo: 抽幾格驗證數字落在研究區間內
export function __demo() {
  const cases: [string, string, number, number][] = [
    ["數學", "高中", 700, 1000], // 104：700–1000
    ["英文", "國中", 400, 700], // pro360：500–700
    ["程式設計", "成人", 900, 1300], // 專業溢價
    ["伴讀", "國小", 250, 400], // 伴讀 250–400
    ["日文", "成人", 600, 900], // AmazingTalker 500–833
  ];
  for (const [s, l, lo, hi] of cases) {
    const v = baselineRate(s, l);
    if (v < lo || v > hi) {
      throw new Error(`baselineRate(${s},${l})=${v} 不在 [${lo},${hi}]`);
    }
  }
  return true;
}
