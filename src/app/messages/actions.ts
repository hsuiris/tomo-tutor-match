"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notify } from "@/lib/email";
import { publicName } from "@/lib/user";
import type { ActionState } from "@/lib/types";

// 把所有系統通知標為已讀
export async function markNotificationsRead() {
  const session = await auth();
  if (!session) return;
  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath("/messages");
}

// 取得或建立與某人的對話，回傳 conversationId（client 端再導轉）
export async function startConversation(
  otherUserId: string
): Promise<{ conversationId?: string; error?: string }> {
  const session = await auth();
  if (!session) return { error: "請先登入" };
  if (otherUserId === session.user.id) {
    return { error: "不能和自己對話" };
  }

  // 確認對方存在
  const other = await db.user.findUnique({
    where: { id: otherUserId },
    select: { id: true },
  });
  if (!other) return { error: "找不到對象" };

  // userAId 永遠 < userBId，確保配對唯一
  const [userAId, userBId] = [session.user.id, otherUserId].sort();

  const convo = await db.conversation.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
  });

  return { conversationId: convo.id };
}

// 送出訊息
export async function sendMessage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session) return { error: "請先登入" };

  const conversationId = formData.get("conversationId")?.toString() ?? "";
  const body = formData.get("body")?.toString().trim() ?? "";
  if (!body) return { error: "訊息不能空白" };
  if (body.length > 2000) return { error: "訊息過長" };

  const convo = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userAId: true, userBId: true },
  });
  if (
    !convo ||
    (convo.userAId !== session.user.id && convo.userBId !== session.user.id)
  ) {
    return { error: "沒有權限" };
  }

  await db.$transaction([
    db.message.create({
      data: { conversationId, senderId: session.user.id, body },
    }),
    db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  // 通知收訊方（依其通知偏好；未設 email 服務則略過）
  const recipientId =
    convo.userAId === session.user.id ? convo.userBId : convo.userAId;
  const sender = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, displayName: true },
  });
  await notify({
    userId: recipientId,
    kind: "message",
    subject: `Tomo：${sender ? publicName(sender) : "有人"}傳了新訊息給你`,
    html: `<p>你在 Tomo 收到一則新訊息，登入即可查看與回覆。</p>`,
  });

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { success: "sent" };
}
