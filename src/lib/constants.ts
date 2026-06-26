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

// 老師的教育程度（最高學歷）
export const EDU_LEVELS = [
  "高中職",
  "大學在學",
  "學士",
  "碩士在學",
  "碩士",
  "博士在學",
  "博士",
] as const;

export const REGIONS = [
  "線上",
  "台北市",
  "新北市",
  "桃園市",
  "新竹市",
  "台中市",
  "台南市",
  "高雄市",
  "基隆市",
  "其他",
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
