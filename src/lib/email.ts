import { db } from "@/lib/db";

// 寄送 Email：用 Resend HTTP API（純 fetch，免額外套件）。
// 需設環境變數 RESEND_API_KEY 與 MAIL_FROM；未設定時略過寄送（只記 log），不影響主流程。
// ponytail: 單一 provider 夠用；要換 SMTP/SES 再抽介面。
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    console.warn(`[email] 略過寄送（未設定 RESEND_API_KEY/MAIL_FROM）：${args.subject}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: args.to, subject: args.subject, html: args.html }),
    });
    if (!res.ok) {
      console.error(`[email] 寄送失敗 ${res.status}: ${await res.text()}`);
    }
  } catch (e) {
    console.error("[email] 寄送錯誤", e);
  }
}

// 依使用者通知偏好寄送（總開關 + 分類開關都要開才寄）
export async function notify(opts: {
  userId: string;
  kind: "jobUpdate" | "message";
  subject: string;
  html: string;
}): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: opts.userId },
    select: {
      email: true,
      emailNotifications: true,
      notifyJobUpdates: true,
      notifyMessages: true,
    },
  });
  if (!user || !user.emailNotifications) return;
  if (opts.kind === "jobUpdate" && !user.notifyJobUpdates) return;
  if (opts.kind === "message" && !user.notifyMessages) return;
  await sendEmail({ to: user.email, subject: opts.subject, html: opts.html });
}
