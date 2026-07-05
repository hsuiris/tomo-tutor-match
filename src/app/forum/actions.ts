"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { isEmailVerified } from "@/lib/verify-email";
import { notifySystem } from "@/lib/notification";
import type { ActionState } from "@/lib/types";

const TOO_MANY = "操作太頻繁，請稍後再試";

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
  if (!(await isEmailVerified(session.user.id))) {
    return { error: "請先完成 Email 驗證（到信箱點擊驗證連結）" };
  }

  // 防灌文：每人每小時最多 5 篇
  if (!(await rateLimit(`forum:post:${session.user.id}`, 5, 3600))) {
    return { error: TOO_MANY };
  }

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
  if (!(await isEmailVerified(session.user.id))) {
    return { error: "請先完成 Email 驗證（到信箱點擊驗證連結）" };
  }

  // 防洗版：每人每小時最多 20 則回覆
  if (!(await rateLimit(`forum:reply:${session.user.id}`, 20, 3600))) {
    return { error: TOO_MANY };
  }

  const postId = formData.get("postId")?.toString() ?? "";
  const rawParentId = formData.get("parentId")?.toString() || null;
  const body = formData.get("body")?.toString().trim() ?? "";
  const anonymous = formData.get("anonymous") === "on";

  if (body.length < 1)
    return { fieldErrors: { body: ["請輸入回覆內容"] }, values: { body } };
  if (body.length > 2000)
    return { fieldErrors: { body: ["內容過長"] }, values: { body } };

  const post = await db.forumPost.findUnique({
    where: { id: postId },
    select: { id: true, board: true, title: true, authorId: true },
  });
  if (!post) return { error: "找不到主題" };

  // 巢狀回覆（限一層）：回覆子留言時自動掛回其父留言
  let parentId: string | null = null;
  let parentAuthorId: string | null = null;
  if (rawParentId) {
    const parent = await db.forumReply.findUnique({
      where: { id: rawParentId },
      select: { id: true, postId: true, parentId: true, authorId: true },
    });
    if (!parent || parent.postId !== postId) return { error: "找不到要回覆的留言" };
    parentId = parent.parentId ?? parent.id;
    parentAuthorId = parent.authorId;
  }

  await db.$transaction([
    db.forumReply.create({
      data: { postId, body, anonymous, parentId, authorId: session.user.id },
    }),
    db.forumPost.update({
      where: { id: postId },
      data: { lastReplyAt: new Date() },
    }),
  ]);

  // 站內通知：貼文作者、被回覆的留言作者（排除自己、避免重複）
  const href = `/forum/${post.board.toLowerCase()}/${postId}`;
  const preview = body.length > 50 ? `${body.slice(0, 50)}…` : body;
  const targets = new Set<string>();
  if (post.authorId !== session.user.id) targets.add(post.authorId);
  if (parentAuthorId && parentAuthorId !== session.user.id) {
    targets.add(parentAuthorId);
  }
  for (const userId of targets) {
    await notifySystem(
      userId,
      userId === post.authorId
        ? `你的貼文「${post.title}」有新回覆`
        : `你在「${post.title}」的留言有新回覆`,
      preview,
      href
    );
  }

  revalidatePath(href);
  return { success: "已回覆" };
}

// 編輯自己的貼文
export async function updateForumPost(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const postId = formData.get("postId")?.toString() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const body = formData.get("body")?.toString().trim() ?? "";
  if (title.length < 4)
    return { fieldErrors: { title: ["標題至少 4 個字"] } };
  if (body.length < 5)
    return { fieldErrors: { body: ["內容至少 5 個字"] } };

  const post = await db.forumPost.findUnique({
    where: { id: postId },
    select: { authorId: true, board: true },
  });
  if (!post || post.authorId !== session.user.id) return { error: "沒有權限" };

  await db.forumPost.update({
    where: { id: postId },
    data: { title, body, editedAt: new Date() },
  });

  revalidatePath(`/forum/${post.board.toLowerCase()}/${postId}`);
  revalidatePath(`/forum/${post.board.toLowerCase()}`);
  return { success: "已更新" };
}

// 刪除自己的貼文（回覆一併刪除）
export async function deleteOwnForumPost(
  postId: string
): Promise<{ redirectTo?: string; error?: string }> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const post = await db.forumPost.findUnique({
    where: { id: postId },
    select: { authorId: true, board: true },
  });
  if (!post || post.authorId !== session.user.id) return { error: "沒有權限" };

  await db.forumPost.delete({ where: { id: postId } });

  const board = post.board.toLowerCase();
  revalidatePath(`/forum/${board}`);
  return { redirectTo: `/forum/${board}` };
}

// 編輯自己的回覆
export async function updateForumReply(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const replyId = formData.get("replyId")?.toString() ?? "";
  const body = formData.get("body")?.toString().trim() ?? "";
  if (body.length < 1) return { fieldErrors: { body: ["請輸入回覆內容"] } };
  if (body.length > 2000) return { fieldErrors: { body: ["內容過長"] } };

  const reply = await db.forumReply.findUnique({
    where: { id: replyId },
    select: { authorId: true, postId: true, post: { select: { board: true } } },
  });
  if (!reply || reply.authorId !== session.user.id) return { error: "沒有權限" };

  await db.forumReply.update({
    where: { id: replyId },
    data: { body, editedAt: new Date() },
  });

  revalidatePath(`/forum/${reply.post.board.toLowerCase()}/${reply.postId}`);
  return { success: "已更新" };
}

// 刪除自己的回覆（其下的子回覆一併刪除）
export async function deleteOwnForumReply(
  replyId: string
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const reply = await db.forumReply.findUnique({
    where: { id: replyId },
    select: { authorId: true, postId: true, post: { select: { board: true } } },
  });
  if (!reply || reply.authorId !== session.user.id) return { error: "沒有權限" };

  await db.forumReply.delete({ where: { id: replyId } });

  revalidatePath(`/forum/${reply.post.board.toLowerCase()}/${reply.postId}`);
  return {};
}
