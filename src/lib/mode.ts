// 目前檢視身份：家長（找老師）或老師（找學生）。
// 存 cookie、不進 DB——這是裝置層的檢視偏好、不是權限，人人都能切。
// ponytail: cookie 而非 role 欄位，免 migration；要「註冊即定身份」再升級。
export type Mode = "parent" | "teacher";

export const MODE_COOKIE = "tomo_mode";

// 純函式（無 next/headers 依賴），可用 tsx 直接單元測試：
// 只有 "teacher" 認得，其餘一律回家長（安全預設）。
export function parseMode(value: string | undefined | null): Mode {
  return value === "teacher" ? "teacher" : "parent";
}

// 動態載入 next/headers，讓上面的 parseMode 能脫離 Next runtime 測試。
export async function getMode(): Promise<Mode> {
  const { cookies } = await import("next/headers");
  return parseMode((await cookies()).get(MODE_COOKIE)?.value);
}
