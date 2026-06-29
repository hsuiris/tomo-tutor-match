import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "姓名至少 2 個字"),
    email: z.string().email("請輸入有效的 Email"),
    password: z
      .string()
      .min(6, "密碼至少 6 個字元")
      .regex(/[A-Za-z]/, "密碼需包含英文字母")
      .regex(/[0-9]/, "密碼需包含數字"),
    confirmPassword: z.string(),
    role: z.enum(["STUDENT", "TUTOR"], {
      message: "請選擇身分",
    }),
    gender: z.enum(["MALE", "FEMALE", "UNDISCLOSED"], {
      message: "請選擇性別",
    }),
    // checkbox 勾選時 FormData 值為 "on"，未勾選則缺欄位 → 報錯
    consent: z.literal("on", {
      message: "請先閱讀並勾選同意隱私權政策與個資蒐集告知",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "兩次輸入的密碼不一致",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("請輸入有效的 Email"),
  password: z.string().min(1, "請輸入密碼"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// 老師檔案
export const profileSchema = z.object({
  bio: z.string().min(1, "請填寫自我介紹").max(1000, "自我介紹過長"),
  subjects: z.array(z.string()).min(1, "請至少選擇一個科目"),
  levels: z.array(z.string()).min(1, "請至少選擇一個可教學制"),
  regions: z.array(z.string()).min(1, "請至少選擇一個地區"),
  // 時薪區間（皆可選；只填一邊也行）
  hourlyRate: z
    .number({ message: "請輸入數字" })
    .int()
    .min(0)
    .max(100000)
    .optional(),
  hourlyRateMax: z
    .number({ message: "請輸入數字" })
    .int()
    .min(0)
    .max(100000)
    .optional(),
  experience: z.string().min(1, "請填寫教學經驗").max(500, "教學經驗過長"),
  education: z.string().min(1, "請填寫科系／學歷").max(500, "內容過長"),
  university: z.string().min(1, "請填寫就讀大學").max(100, "校名過長"),
  eduLevel: z.string().max(20).optional(),
  mode: z.enum(["ONLINE", "IN_PERSON", "BOTH"]),
  gender: z.enum(["MALE", "FEMALE", "UNDISCLOSED"]),
  // 頭像 data URL（限制長度避免過大，約 2MB base64）
  // 必須是 data:image/ 開頭，避免存入外部網址或非圖片內容
  avatarUrl: z
    .string()
    .max(3_000_000)
    .refine((v) => v.startsWith("data:image/"), "頭像格式不正確")
    .optional(),
  isPublished: z.boolean(),
}).refine(
  (d) =>
    d.hourlyRate == null ||
    d.hourlyRateMax == null ||
    d.hourlyRateMax >= d.hourlyRate,
  { message: "最高時薪需大於或等於最低", path: ["hourlyRateMax"] }
);

// 家教需求案件
export const jobSchema = z.object({
  title: z.string().min(4, "標題至少 4 個字").max(100),
  subject: z.string().min(1, "請選擇科目"),
  level: z.string().min(1, "請選擇年級／學制"),
  region: z.string().min(1, "請選擇地區"),
  mode: z.enum(["ONLINE", "IN_PERSON", "BOTH"]),
  // 預算區間（皆可選；只填一邊也行）
  budget: z.number().int().positive("預算需為正整數").max(100000).optional(),
  budgetMax: z.number().int().positive("預算需為正整數").max(100000).optional(),
  description: z.string().max(2000, "內容過長").optional(),
  studentStatus: z
    .string()
    .min(5, "請描述學生狀況,至少 5 個字")
    .max(1000),
  parentNeeds: z.string().min(5, "請描述家長訴求,至少 5 個字").max(1000),
}).refine(
  (d) => d.budget == null || d.budgetMax == null || d.budgetMax >= d.budget,
  { message: "最高預算需大於或等於最低", path: ["budgetMax"] }
);

// 應徵
export const applicationSchema = z.object({
  jobId: z.string().min(1),
  message: z.string().min(5, "請寫下你的應徵訊息,至少 5 個字").max(1000),
});
