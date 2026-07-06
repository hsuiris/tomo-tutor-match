import crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmail, emailButton } from "@/lib/email";
import { siteUrl } from "@/lib/site";

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

// Email 服務是否已設定（未設定時註冊直接視為已驗證，避免把整個環境鎖死）
// 支援 Resend（自有網域）或 Gmail SMTP（過渡）任一
export function emailServiceConfigured(): boolean {
  return !!(
    process.env.RESEND_API_KEY ||
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  );
}

// 使用者是否已完成 Email 驗證
export async function isEmailVerified(userId: string): Promise<boolean> {
  const u = await db.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  return !!u?.emailVerified;
}

// 產生驗證 token 並寄出驗證信（24 小時有效；一次只留一張有效 token）
export async function sendVerificationEmail(
  userId: string,
  email: string
): Promise<void> {
  const raw = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.emailVerificationToken.deleteMany({ where: { userId } });
  await db.emailVerificationToken.create({
    data: { tokenHash: sha256(raw), userId, expiresAt },
  });

  const link = `${siteUrl}/verify-email?token=${raw}`;
  await sendEmail({
    to: email,
    subject: "請驗證你的 Tomo 帳號 Email",
    html: `<p>感謝你註冊 Tomo 家教媒合平台。請點擊下方按鈕完成 Email 驗證（連結 24 小時內有效）：</p>
${emailButton(link, "驗證我的 Email")}
<p>完成驗證後即可使用發案、應徵、私訊等功能。若這不是你本人操作，請忽略這封信。</p>`,
  });
}

// 用 token 完成驗證。成功回傳 userId，無效或過期回傳 null
export async function verifyEmailToken(
  rawToken: string
): Promise<string | null> {
  if (!rawToken) return null;
  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash: sha256(rawToken) },
    select: { userId: true, expiresAt: true },
  });
  if (!record || record.expiresAt < new Date()) return null;

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    db.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);
  return record.userId;
}
