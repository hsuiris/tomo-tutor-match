import { headers } from "next/headers";
import { db } from "@/lib/db";

// 固定視窗速率限制，狀態存在 Postgres（serverless 多實例也共用）。
// 回傳 true=放行、false=已超限。
// ponytail: 失敗時 fail-open（限流只是防護層，不是登入閘門，DB 異常不該鎖死所有人）。
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowSec * 1000);
  try {
    const existing = await db.rateLimit.findUnique({ where: { key } });

    // 沒紀錄、或視窗已過 → 開新視窗
    if (!existing || existing.expiresAt < now) {
      await db.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, expiresAt },
        update: { count: 1, expiresAt },
      });
      return true;
    }

    if (existing.count >= limit) return false;

    await db.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return true;
  } catch {
    return true; // fail-open
  }
}

// 取用戶端 IP（Vercel 會帶 x-forwarded-for）
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}
