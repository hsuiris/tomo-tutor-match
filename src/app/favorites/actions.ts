"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// 切換收藏（愛心）：老師卡 type="tutor"、學生卡 type="job"
export async function toggleFavorite(
  type: "tutor" | "job",
  targetId: string
): Promise<{ favorited?: boolean; error?: string }> {
  const session = await auth();
  if (!session) return { error: "login" };
  const userId = session.user.id;

  const where =
    type === "tutor"
      ? { userId_tutorProfileId: { userId, tutorProfileId: targetId } }
      : { userId_jobId: { userId, jobId: targetId } };

  const existing = await db.favorite.findUnique({ where });
  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/favorites");
    return { favorited: false };
  }

  await db.favorite.create({
    data:
      type === "tutor"
        ? { userId, tutorProfileId: targetId }
        : { userId, jobId: targetId },
  });
  revalidatePath("/favorites");
  return { favorited: true };
}
