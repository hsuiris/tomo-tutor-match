"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { registerSchema, loginSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";

const TOO_MANY = "嘗試次數過多，請稍後再試";

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
  // 出錯時回填使用者剛輸入的值
  values?: Record<string, string>;
};

// 註冊
export async function registerUser(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  // 出錯時回填（密碼不回填，重新輸入較安全）
  const values = {
    name: String(raw.name ?? ""),
    email: String(raw.email ?? ""),
  };

  // 註冊：每個 IP 每小時最多 5 次，擋註冊灌水
  if (!(await rateLimit(`register:ip:${await clientIp()}`, 5, 3600))) {
    return { error: TOO_MANY, values };
  }

  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const { name, email, password, role, gender } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "這個 Email 已經註冊過了", values };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      gender,
      // 註冊老師時自動建立空白檔案
      ...(role === "TUTOR"
        ? { tutorProfile: { create: {} } }
        : {}),
    },
  });

  // 註冊成功後自動登入（signIn 成功會丟出 redirect）
  await signIn("credentials", {
    email,
    password,
    redirectTo: role === "TUTOR" ? "/dashboard/profile" : "/tutors",
  });

  return {};
}

// 登入
export async function loginUser(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = loginSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // 登入：擋暴力破解。每 IP 10 次/5分、每帳號 5 次/5分（在 bcrypt 之前先擋）
  const ip = await clientIp();
  if (
    !(await rateLimit(`login:ip:${ip}`, 10, 300)) ||
    !(await rateLimit(`login:email:${parsed.data.email.toLowerCase()}`, 5, 300))
  ) {
    // 結構化記到 stderr，Vercel logs 可據此設「登入失敗率」告警
    console.warn(`[login-failure] reason=rate-limited ip=${ip}`);
    return { error: TOO_MANY };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      console.warn(`[login-failure] reason=bad-credentials ip=${ip}`);
      return { error: "Email 或密碼錯誤" };
    }
    throw error; // redirect 需要往上拋
  }

  return {};
}

// 忘記密碼：寄送重設連結
export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";

  // 擋濫發：每 IP 5 次/時、每 email 3 次/時
  const ip = await clientIp();
  if (
    !(await rateLimit(`pwreset:ip:${ip}`, 5, 3600)) ||
    !(await rateLimit(`pwreset:email:${email}`, 3, 3600))
  ) {
    return { error: TOO_MANY };
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  // 不論帳號是否存在都回相同訊息，避免洩漏註冊狀態
  const generic = {
    success: "若這個 Email 已註冊，我們已寄出重設連結，請查看信箱（含垃圾郵件匣）。",
  };
  if (!user) return generic;

  const raw = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 小時
  // 一次只留一張有效權杖
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await db.passwordResetToken.create({
    data: { tokenHash: sha256(raw), userId: user.id, expiresAt },
  });

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  const link = `${proto}://${host}/reset-password?token=${raw}`;
  await sendEmail({
    to: email,
    subject: "Tomo：重設你的密碼",
    html: `<p>你要求重設 Tomo 密碼。點擊以下連結設定新密碼（1 小時內有效，僅能使用一次）：</p>
<p><a href="${link}">${link}</a></p>
<p>若不是你本人操作，請忽略這封信，你的密碼不會變動。</p>`,
  });

  return generic;
}

// 忘記密碼：用權杖設定新密碼
export async function resetPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = formData.get("token")?.toString() ?? "";
  const next = formData.get("next")?.toString() ?? "";
  const confirm = formData.get("confirm")?.toString() ?? "";

  if (!token) return { error: "連結無效，請重新申請。" };
  if (next !== confirm) {
    return { fieldErrors: { confirm: ["兩次輸入的新密碼不一致"] } };
  }
  if (next.length < 6 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
    return { fieldErrors: { next: ["密碼至少 6 字元，需含英文字母與數字"] } };
  }

  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: sha256(token) },
    select: { userId: true, expiresAt: true },
  });
  if (!record || record.expiresAt < new Date()) {
    return { error: "連結無效或已過期，請重新申請。" };
  }

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash: await bcrypt.hash(next, 10) },
    }),
    db.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
  ]);

  return { success: "密碼已重設，請用新密碼登入。" };
}
