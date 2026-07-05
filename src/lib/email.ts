import nodemailer from "nodemailer";
import { db } from "@/lib/db";

// 寄送 Email：用 Gmail SMTP（免自有網域）。
// 需設環境變數 GMAIL_USER 與 GMAIL_APP_PASSWORD（Gmail 應用程式密碼，非帳號密碼）；
// 未設定時略過寄送（只記 log），不影響主流程。
// ponytail: Gmail SMTP 夠用（每日約 500 封上限）；量大或要自訂寄件網域再換 Resend/SES。
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.warn(`[email] 略過寄送（未設定 GMAIL_USER/GMAIL_APP_PASSWORD）：${args.subject}`);
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `Tomo <${user}>`,
      to: args.to,
      // 主旨含使用者輸入（案件標題／化名），去除換行避免標頭注入
      subject: args.subject.replace(/[\r\n]+/g, " "),
      html: args.html,
    });
  } catch (e) {
    console.error("[email] 寄送錯誤", e);
  }
}

// 依使用者通知偏好寄送（總開關 + 分類開關都要開才寄）
// kind "system"：帳號層級通知（如認證審核結果），只看總開關
export async function notify(opts: {
  userId: string;
  kind: "jobUpdate" | "message" | "system";
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
