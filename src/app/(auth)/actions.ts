"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { registerSchema, loginSchema } from "@/lib/validations";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const TOO_MANY = "嘗試次數過多，請稍後再試";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// 註冊
export async function registerUser(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  // 註冊：每個 IP 每小時最多 5 次，擋註冊灌水
  if (!(await rateLimit(`register:ip:${await clientIp()}`, 5, 3600))) {
    return { error: TOO_MANY };
  }

  const raw = Object.fromEntries(formData);
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, role, gender } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "這個 Email 已經註冊過了" };
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
    return { error: TOO_MANY };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email 或密碼錯誤" };
    }
    throw error; // redirect 需要往上拋
  }

  return {};
}
