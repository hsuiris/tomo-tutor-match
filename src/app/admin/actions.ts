"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifySystem } from "@/lib/notification";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

// 認證項目對應的中文名稱
const VERIFY_LABEL = {
  IDENTITY: "實名認證",
  BACKGROUND: "無犯罪紀錄查驗",
  EDUCATION: "學歷與成績認證",
} as const;

export async function approveVerification(id: string) {
  if (!(await requireAdmin())) return;

  const req = await db.verificationRequest.findUnique({ where: { id } });
  if (!req || req.status !== "PENDING") return;

  await db.$transaction([
    db.verificationRequest.update({
      where: { id },
      // 審核完成即清除證件影像，不長期保存敏感個資
      data: { status: "APPROVED", reviewedAt: new Date(), docUrl: null },
    }),
    db.user.update({
      where: { id: req.userId },
      data:
        req.type === "IDENTITY"
          ? { idVerified: true }
          : req.type === "BACKGROUND"
            ? { bgCheckVerified: true }
            : { eduVerified: true },
    }),
  ]);

  // 通知本人審核通過
  await notifySystem(
    req.userId,
    `${VERIFY_LABEL[req.type]}已通過`,
    `你的${VERIFY_LABEL[req.type]}審核通過，個人檔案已顯示信任徽章。`,
    "/dashboard/account"
  );

  revalidatePath("/admin/verifications");
}

export async function rejectVerification(id: string) {
  if (!(await requireAdmin())) return;

  const req = await db.verificationRequest.update({
    where: { id },
    // 退回後同樣清除證件影像
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      note: "證件不清晰或不符",
      docUrl: null,
    },
  });

  // 通知本人審核未通過，可重新送審
  await notifySystem(
    req.userId,
    `${VERIFY_LABEL[req.type]}未通過`,
    `你的${VERIFY_LABEL[req.type]}審核未通過：${req.note}。可重新上傳清晰證件再次送審。`,
    "/dashboard/account"
  );

  revalidatePath("/admin/verifications");
}

// 停用／復用使用者
export async function setUserDisabled(id: string, disabled: boolean) {
  if (!(await requireAdmin())) return;
  await db.user.updateMany({ where: { id }, data: { disabled } });
  revalidatePath("/admin/users");
}

// 強制關閉案件
export async function closeJob(id: string) {
  if (!(await requireAdmin())) return;
  await db.jobPost.updateMany({
    where: { id, status: { not: "CLOSED" } },
    data: { status: "CLOSED" },
  });
  revalidatePath("/admin/matches");
}

// 刪除論壇文章（回覆由 schema onDelete: Cascade 連帶刪除）
export async function deleteForumPost(id: string) {
  if (!(await requireAdmin())) return;
  await db.forumPost.deleteMany({ where: { id } });
  revalidatePath("/admin/content");
}

// 刪除論壇回覆
export async function deleteForumReply(id: string) {
  if (!(await requireAdmin())) return;
  await db.forumReply.deleteMany({ where: { id } });
  revalidatePath("/admin/content");
}

// 刪除評價
export async function deleteReview(id: string) {
  if (!(await requireAdmin())) return;
  await db.review.deleteMany({ where: { id } });
  revalidatePath("/admin/content");
}
