// 討論區看板設定
export const FORUM_BOARDS = {
  tutor: {
    value: "TUTOR" as const,
    title: "老師討論區",
    desc: "教學經驗、接案心得、課程資源與題庫交流",
    image: "/teacher.png",
    accent: "bg-sun",
  },
  parent: {
    value: "PARENT" as const,
    title: "家長討論區",
    desc: "找家教、陪讀、升學與學習狀況經驗分享",
    image: "/parent.png",
    accent: "bg-cobalt",
  },
};

export type BoardSlug = keyof typeof FORUM_BOARDS;

export function isBoardSlug(s: string): s is BoardSlug {
  return s === "tutor" || s === "parent";
}
