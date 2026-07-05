"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// 「成為老師」：學生升級為老師（明確戴上老師帽子）
// 學生零摩擦進場，要當老師才需要建立檔案 + 後續驗證
export async function becomeTutor() {
  const session = await auth();
  if (!session) redirect("/login");

  // 建立空白老師檔案（已存在則不動）
  await db.tutorProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  });
  // 同步 role 給公開檔案等讀 DB 的地方顯示用；不動到 ADMIN
  await db.user.updateMany({
    where: { id: session.user.id, role: "STUDENT" },
    data: { role: "TUTOR" },
  });

  revalidatePath("/dashboard");
  // 帶去填檔案 + 安全認證
  redirect("/dashboard/profile");
}

// 面板上的接案狀態切換：公開（可被搜尋/應徵）或關閉接案
export async function setProfilePublished(published: boolean) {
  const session = await auth();
  if (!session) return;

  await db.tutorProfile.updateMany({
    where: { userId: session.user.id },
    data: { isPublished: published },
  });

  revalidatePath("/dashboard");
  revalidatePath("/tutors");
  revalidatePath("/");
  revalidatePath(`/u/${session.user.id}`);
}
