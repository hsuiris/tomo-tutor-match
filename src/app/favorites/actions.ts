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

// 收藏備註（只有自己看得到）
export async function updateFavoriteNote(
  favoriteId: string,
  note: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "請先登入" };
  if (note.length > 200) return { error: "備註過長（200 字內）" };

  await db.favorite.updateMany({
    where: { id: favoriteId, userId: session.user.id },
    data: { note: note.trim() || null },
  });
  revalidatePath("/favorites");
  return {};
}

// 從收藏移除
export async function removeFavorite(favoriteId: string) {
  const session = await auth();
  if (!session) return;
  await db.favorite.deleteMany({
    where: { id: favoriteId, userId: session.user.id },
  });
  revalidatePath("/favorites");
}
