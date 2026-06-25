// 公開顯示名稱：優先用化名，否則遮罩本名（本名永不對外完整顯示）
export function maskName(name: string): string {
  if (!name) return "匿名用戶";
  if (name.length <= 1) return name + "＊";
  return name[0] + "＊".repeat(name.length - 1);
}

export function publicName(u: {
  displayName?: string | null;
  name: string;
}): string {
  const alias = u.displayName?.trim();
  return alias && alias.length > 0 ? alias : maskName(u.name);
}

// 用於 select 時的最小欄位型別
export type PublicUserFields = {
  displayName: string | null;
  name: string;
  idVerified: boolean;
  bgCheckVerified: boolean;
};

export function roleLabel(role: "STUDENT" | "TUTOR" | "ADMIN"): string {
  return role === "TUTOR" ? "老師" : role === "ADMIN" ? "管理員" : "學生／家長";
}

// 討論區作者顯示：匿名只顯示身分,不顯示姓名
export function forumAuthor(
  a: { name: string; displayName: string | null; role: "STUDENT" | "TUTOR" | "ADMIN" },
  anonymous: boolean
): string {
  const rl = roleLabel(a.role);
  return anonymous ? `匿名・${rl}` : `${publicName(a)}・${rl}`;
}
