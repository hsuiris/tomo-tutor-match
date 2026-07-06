import nodemailer from "nodemailer";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site";

// 寄件人顯示名稱與地址。
// 正式（有網域）：設 RESEND_API_KEY + EMAIL_FROM（如 "Tomo 家教媒合 <noreply@你的網域>"）
// 過渡（無網域）：用 Gmail SMTP（GMAIL_USER / GMAIL_APP_PASSWORD）
function fromAddress(): string {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  const g = process.env.GMAIL_USER;
  return g ? `Tomo 家教媒合 <${g}>` : "Tomo 家教媒合";
}

// 統一信件外框：品牌標頭 + 內容 + 頁尾（含系統通知說明，降低被判垃圾的機率）
function wrapHtml(bodyHtml: string): string {
  return `<div style="font-family:-apple-system,'Noto Sans TC',Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2c2a26;line-height:1.7">
  <div style="font-size:22px;font-weight:800;color:#1f2937">Tomo 家教媒合平台</div>
  <div style="height:3px;width:48px;background:#e6a532;margin:8px 0 20px"></div>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
  <div style="font-size:12px;color:#9a968c">
    這是 Tomo 家教媒合平台的系統通知信，請勿直接回覆。<br />
    你可在<a href="${siteUrl}/dashboard/account" style="color:#3b6ea5">帳號設定</a>調整通知偏好。<br />
    ${siteUrl}
  </div>
</div>`;
}

// 信件內的主要行動按鈕（驗證、重設密碼等），附純文字連結備援
export function emailButton(href: string, label: string): string {
  return `<p style="margin:22px 0"><a href="${href}" style="display:inline-block;background:#e6a532;color:#ffffff;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:999px">${label}</a></p>
<p style="font-size:13px;color:#9a968c">若按鈕無法點擊，請複製並貼上這個連結：<br />${href}</p>`;
}

// 由 HTML 粗略生成純文字版（供不顯示 HTML 的信箱與過濾器判讀，提高送達率）
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// 寄送 Email：優先 Resend（自有網域，送達率高），否則 Gmail SMTP，否則略過。
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const subject = args.subject.replace(/[\r\n]+/g, " "); // 去換行避免標頭注入
  const html = wrapHtml(args.html);
  const text = htmlToText(args.html);
  const from = fromAddress();

  // 1) Resend（REST API，不需 SDK）
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: args.to, subject, html, text }),
      });
      if (!res.ok) {
        console.error("[email] Resend 失敗", res.status, await res.text());
      }
    } catch (e) {
      console.error("[email] Resend 錯誤", e);
    }
    return;
  }

  // 2) Gmail SMTP（過渡）
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.warn(`[email] 略過寄送（未設定 RESEND_API_KEY 或 GMAIL_*）：${subject}`);
    return;
  }
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transporter.sendMail({ from, to: args.to, subject, html, text });
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
