"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/types";

// 更新公開化名
export async function updateAlias(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const displayName = formData.get("displayName")?.toString().trim() ?? "";
  if (displayName.length > 30) return { error: "化名過長" };

  await db.user.update({
    where: { id: session.user.id },
    data: { displayName: displayName || null },
  });

  revalidatePath("/dashboard/account");
  return { success: "化名已更新" };
}

// 送出安全認證申請（上傳證件）
export async function submitVerification(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const type = formData.get("type")?.toString();
  const docUrl = formData.get("docUrl")?.toString() ?? "";

  if (type !== "IDENTITY" && type !== "BACKGROUND" && type !== "EDUCATION") {
    return { error: "認證類型錯誤" };
  }
  if (!docUrl.startsWith("data:image/")) {
    return { error: "請上傳證件圖片" };
  }
  if (docUrl.length > 4_000_000) {
    return { error: "圖片過大,請小於 3MB" };
  }

  // 已有待審核的同類型申請就不重複
  const pending = await db.verificationRequest.findFirst({
    where: { userId: session.user.id, type, status: "PENDING" },
  });
  if (pending) return { error: "你已有一筆審核中的申請" };

  await db.verificationRequest.create({
    data: { userId: session.user.id, type, docUrl },
  });

  revalidatePath("/dashboard/account");
  return { success: "已送出,我們會盡快審核" };
}
