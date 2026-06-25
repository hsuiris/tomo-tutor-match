"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/types";

// 在對方個人檔案底下留下評價（雙向：學生↔老師,需曾完成媒合）
export async function submitReview(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const revieweeId = formData.get("revieweeId")?.toString() ?? "";
  const rating = Number(formData.get("rating"));
  const comment = formData.get("comment")?.toString().trim() || null;
  const me = session.user.id;

  if (revieweeId === me) return { error: "不能評價自己" };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "請給 1 到 5 顆星" };
  }

  // 資格：雙方曾在某案件完成媒合（任一方向）
  const matched = await db.application.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { tutor: { userId: me }, job: { studentId: revieweeId } },
        { tutor: { userId: revieweeId }, job: { studentId: me } },
      ],
    },
    select: { id: true },
  });
  if (!matched) {
    return { error: "你尚未與這位使用者完成媒合,無法評價" };
  }

  const existing = await db.review.findUnique({
    where: { revieweeId_authorId: { revieweeId, authorId: me } },
    select: { id: true },
  });
  if (existing) return { error: "你已經評價過了" };

  await db.$transaction(async (tx) => {
    await tx.review.create({
      data: { revieweeId, authorId: me, rating, comment },
    });
    // 若被評價者是老師,更新其平均星等
    const profile = await tx.tutorProfile.findUnique({
      where: { userId: revieweeId },
      select: { id: true },
    });
    if (profile) {
      const agg = await tx.review.aggregate({
        where: { revieweeId },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.tutorProfile.update({
        where: { id: profile.id },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          ratingCount: agg._count._all,
        },
      });
    }
  });

  revalidatePath(`/u/${revieweeId}`);
  return { success: "感謝你的評價!" };
}
