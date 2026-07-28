"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/types";

// 修改密碼
export async function changePassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const current = formData.get("current")?.toString() ?? "";
  const next = formData.get("next")?.toString() ?? "";
  const confirm = formData.get("confirm")?.toString() ?? "";

  if (next !== confirm) {
    return { fieldErrors: { confirm: ["兩次輸入的新密碼不一致"] } };
  }
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
    return { fieldErrors: { next: ["密碼至少 8 字元，需含英文字母與數字"] } };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user) return { error: "找不到帳號" };
  if (!(await bcrypt.compare(current, user.passwordHash))) {
    return { fieldErrors: { current: ["目前密碼不正確"] } };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  return { success: "密碼已更新" };
}

// 更新通知設定
export async function updateNotifications(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  await db.user.update({
    where: { id: session.user.id },
    data: {
      emailNotifications: formData.get("emailNotifications") === "on",
      notifyJobUpdates: formData.get("notifyJobUpdates") === "on",
      notifyMessages: formData.get("notifyMessages") === "on",
    },
  });

  revalidatePath("/dashboard/account");
  return { success: "通知設定已更新" };
}

// 更新公開顯示名稱（化名或本名；「本名」= displayName 設為本名，顯示端不需特判）
export async function updateAlias(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  let displayName: string | null;
  if (formData.get("nameMode")?.toString() === "real") {
    const me = await db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    if (!me) return { error: "請先登入" };
    displayName = me.name;
  } else {
    displayName = formData.get("displayName")?.toString().trim() || null;
    if (displayName && displayName.length > 30) return { error: "化名過長" };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { displayName },
  });

  // 顯示名稱出現在老師檔案頁與發案頁
  revalidatePath("/dashboard/profile");
  revalidatePath("/jobs/new");
  return { success: "顯示名稱已更新" };
}

// 更新檔案照片牆（家長與老師共用；顯示於公開檔案頁）
export async function updatePhotos(
  photos: string[]
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  if (photos.length > 5) return { error: "最多 5 張照片" };
  for (const p of photos) {
    if (!p.startsWith("data:image/")) return { error: "照片格式不正確" };
    if (p.length > 1_200_000) return { error: "每張照片請小於 800KB" };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { photoUrls: photos },
  });

  revalidatePath("/dashboard/account");
  revalidatePath(`/u/${session.user.id}`);
  return {};
}

// 送出安全認證申請（一次可上傳多種證件，由安全認證區底部按鈕送出）
export async function submitVerifications(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  let sent = 0;
  for (const type of ["IDENTITY", "EDUCATION"] as const) {
    const docUrl = formData.get(`doc_${type}`)?.toString() ?? "";
    if (!docUrl) continue;
    if (!docUrl.startsWith("data:image/")) return { error: "請上傳證件圖片" };
    if (docUrl.length > 4_000_000) return { error: "圖片過大,請小於 3MB" };

    // 已有待審核的同類型申請就不重複
    const pending = await db.verificationRequest.findFirst({
      where: { userId: session.user.id, type, status: "PENDING" },
    });
    if (pending) continue;

    await db.verificationRequest.create({
      data: { userId: session.user.id, type, docUrl },
    });
    sent++;
  }

  if (!sent) return { error: "請先選擇要上傳的證件" };

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard/profile");
  return { success: "已送出,我們會盡快審核" };
}
