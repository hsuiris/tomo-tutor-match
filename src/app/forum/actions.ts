"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import type { ActionState } from "@/lib/types";

const BOARD_SLUG: Record<string, "TUTOR" | "PARENT"> = {
  TUTOR: "TUTOR",
  PARENT: "PARENT",
};

export async function createPost(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const board = BOARD_SLUG[formData.get("board")?.toString() ?? ""];
  const title = formData.get("title")?.toString().trim() ?? "";
  const body = formData.get("body")?.toString().trim() ?? "";
  const anonymous = formData.get("anonymous") === "on";
  const values = { title, body };

  if (!board) return { error: "看板錯誤", values };
  if (title.length < 4)
    return { fieldErrors: { title: ["標題至少 4 個字"] }, values };
  if (body.length < 5)
    return { fieldErrors: { body: ["內容至少 5 個字"] }, values };

  const post = await db.forumPost.create({
    data: { board, title, body, anonymous, authorId: session.user.id },
  });

  revalidatePath(`/forum/${board.toLowerCase()}`);
  return { redirectTo: `/forum/${board.toLowerCase()}/${post.id}` };
}

export async function createReply(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const postId = formData.get("postId")?.toString() ?? "";
  const body = formData.get("body")?.toString().trim() ?? "";
  const anonymous = formData.get("anonymous") === "on";

  if (body.length < 1)
    return { fieldErrors: { body: ["請輸入回覆內容"] }, values: { body } };

  const post = await db.forumPost.findUnique({
    where: { id: postId },
    select: { id: true, board: true },
  });
  if (!post) return { error: "找不到主題" };

  await db.$transaction([
    db.forumReply.create({
      data: { postId, body, anonymous, authorId: session.user.id },
    }),
    db.forumPost.update({
      where: { id: postId },
      data: { lastReplyAt: new Date() },
    }),
  ]);

  revalidatePath(`/forum/${post.board.toLowerCase()}/${postId}`);
  return { success: "已回覆" };
}
