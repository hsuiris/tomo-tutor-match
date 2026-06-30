import { db } from "@/lib/db";

// 發一則系統通知給使用者（顯示在訊息頁的「系統通知」區）
export async function notifySystem(
  userId: string,
  title: string,
  body: string,
  href?: string
) {
  await db.notification.create({
    data: { userId, title, body, href: href ?? null },
  });
}
