// 老師檔案詳細欄位的型別、常數與顯示 helper（成績 / 客製時薪 / 上課時間）

export const EXAM_TYPES = [
  "會考",
  "學測",
  "分科測驗（指考）",
  "統測",
  "多益 TOEIC",
  "托福 TOEFL",
  "雅思 IELTS",
  "全民英檢 GEPT",
  "其他",
] as const;

export type ExamScore = { type: string; score: string };
export type RateRule = {
  subject: string;
  level?: string;
  rate: number;
  rateMax?: number;
};
export type AvailabilitySlot = {
  days: string[]; // 週幾，如 ["一","三","五"]
  start: number; // 起始整點 0-23
  end: number; // 結束整點 1-24
  hours?: number; // 一次幾小時（選填）
};
export type Availability =
  | { mode: "discuss" }
  | { mode: "slots"; slots: AvailabilitySlot[] };

export const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"] as const;

// ── 解析（DB 的 Json 可能是任意值，安全轉型）─────────────────
export function parseExams(v: unknown): ExamScore[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((e) =>
    e && typeof e === "object" && "type" in e && "score" in e
      ? [{ type: String((e as ExamScore).type), score: String((e as ExamScore).score) }]
      : []
  );
}

export function parseRateRules(v: unknown): RateRule[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((r) => {
    if (!r || typeof r !== "object" || !("subject" in r) || !("rate" in r)) return [];
    const o = r as RateRule;
    return [
      {
        subject: String(o.subject),
        level: o.level ? String(o.level) : undefined,
        rate: Number(o.rate),
        rateMax: o.rateMax != null ? Number(o.rateMax) : undefined,
      },
    ];
  });
}

export function parseAvailability(v: unknown): Availability | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Availability;
  if (o.mode === "discuss") return { mode: "discuss" };
  if (o.mode === "slots" && Array.isArray(o.slots)) {
    const slots = o.slots.flatMap((s) =>
      s && Array.isArray(s.days) && s.days.length
        ? [
            {
              days: s.days.map(String),
              start: Number(s.start),
              end: Number(s.end),
              hours: s.hours != null ? Number(s.hours) : undefined,
            },
          ]
        : []
    );
    return { mode: "slots", slots };
  }
  return null;
}

// ── 顯示 ────────────────────────────────────────────────
export function rateRuleLabel(r: RateRule): string {
  const who = r.level ? `${r.subject}・${r.level}` : r.subject;
  const money =
    r.rateMax && r.rateMax > r.rate
      ? `NT$${r.rate}–${r.rateMax}`
      : `NT$${r.rate}`;
  return `${who}：${money} / 小時`;
}

function hh(n: number): string {
  return `${String(n).padStart(2, "0")}:00`;
}

export function slotLabel(s: AvailabilitySlot): string {
  const days = s.days.map((d) => `週${d}`).join("、");
  const time = `${hh(s.start)}–${hh(s.end)}`;
  const hrs = s.hours ? `，每次 ${s.hours} 小時` : "";
  return `${days} ${time}${hrs}`;
}
