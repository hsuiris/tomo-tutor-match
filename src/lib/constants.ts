// 全站共用的參考資料：科目、地區、授課方式

export const SUBJECTS = [
  "數學",
  "英文",
  "國文",
  "物理",
  "化學",
  "生物",
  "地理",
  "歷史",
  "程式設計",
  "日文",
  "鋼琴",
  "美術",
  "會計",
  "經濟",
  "伴讀",
] as const;

// 學制／年級（家教收費的主要差異來源之一）
export const LEVELS = ["國小", "國中", "高中", "大學", "成人"] as const;

// 技能類科目不分學制，改用程度分級（入門／初階／進階）
export const SKILL_SUBJECTS = [
  "程式設計",
  "日文",
  "鋼琴",
  "美術",
  "會計",
  "經濟",
] as const;
export const SKILL_LEVELS = ["入門", "初階", "進階"] as const;

// 篩選／統計用：學術年級 + 技能程度的完整清單
export const ALL_LEVELS = [...LEVELS, ...SKILL_LEVELS] as const;

const SKILL_SET = new Set<string>(SKILL_SUBJECTS);
export const isSkillSubject = (s: string) => SKILL_SET.has(s);

// 單一科目對應的程度選項
export function levelsForSubject(subject: string): readonly string[] {
  return isSkillSubject(subject) ? SKILL_LEVELS : LEVELS;
}

// 一組科目對應的程度選項（學術＋技能可並存）
export function levelsForSubjects(subjects: string[]): string[] {
  const hasSkill = subjects.some(isSkillSubject);
  const hasAcademic = subjects.some((s) => !isSkillSubject(s));
  if (hasSkill && !hasAcademic) return [...SKILL_LEVELS];
  if (hasSkill && hasAcademic) return [...LEVELS, ...SKILL_LEVELS];
  return [...LEVELS]; // 預設學術（含未選科目時）
}

// 老師的教育程度（最高學歷）
export const EDU_LEVELS = [
  "高中職",
  "大學在學",
  "學士畢業",
  "碩士在學",
  "碩士畢業",
  "博士在學",
  "博士畢業",
] as const;

export type TeachingMode = "ONLINE" | "IN_PERSON" | "BOTH";

export const MODE_LABELS: Record<TeachingMode, string> = {
  ONLINE: "線上",
  IN_PERSON: "實體",
  BOTH: "線上 / 實體",
};

export type Gender = "MALE" | "FEMALE" | "UNDISCLOSED";

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "男",
  FEMALE: "女",
  UNDISCLOSED: "不公開",
};

// 篩選用（不含「不公開」當作選項，但提供全部）
export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "男" },
  { value: "FEMALE", label: "女" },
];

export const SORT_OPTIONS = [
  { value: "recommended", label: "推薦" },
  { value: "rating", label: "評價最高" },
  { value: "price_asc", label: "時薪低到高" },
  { value: "price_desc", label: "時薪高到低" },
  { value: "newest", label: "最新加入" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const PAGE_SIZE = 9;

// 智能匹配：使用者最在意的重點（會動態調整配對權重）
export const MATCH_PRIORITIES = [
  { value: "balanced", label: "綜合最佳", hint: "各項條件均衡評估" },
  { value: "budget", label: "預算優先", hint: "優先符合預算的老師" },
  { value: "rating", label: "評價優先", hint: "優先口碑高的老師" },
  { value: "credentials", label: "學歷認證優先", hint: "優先已通過認證的老師" },
] as const;

export type MatchPriorityValue = (typeof MATCH_PRIORITIES)[number]["value"];
