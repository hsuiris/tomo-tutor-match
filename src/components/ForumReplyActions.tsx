"use client";

import { useActionState, useState, useTransition } from "react";
import { updateForumReply, deleteOwnForumReply } from "@/app/forum/actions";
import { SubmitButton } from "@/components/ui/form";
import ReplyForm from "@/components/ReplyForm";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

// 留言的內文 + 操作列：回覆（巢狀）、作者可編輯/刪除
export default function ForumReplyActions({
  postId,
  replyId,
  replyTargetId,
  body,
  mine,
  loggedIn,
}: {
  postId: string;
  replyId: string;
  // 巢狀限一層：回覆子留言時掛回最上層留言
  replyTargetId: string;
  body: string;
  mine: boolean;
  loggedIn: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [state, formAction] = useActionState(updateForumReply, initialState);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      {editing && !state.success ? (
        <form action={formAction} className="mt-1 space-y-2">
          <input type="hidden" name="replyId" value={replyId} />
          <textarea
            name="body"
            rows={3}
            defaultValue={body}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line"
          />
          {state.fieldErrors?.body?.map((e) => (
            <p key={e} className="text-xs text-red-500">{e}</p>
          ))}
          {state.error && <p className="text-xs text-red-500">{state.error}</p>}
          <div className="flex gap-2">
            <SubmitButton fullWidth={false}>儲存</SubmitButton>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-line px-5 py-2 text-sm font-medium text-ink/60 hover:bg-sun-soft/40"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">{body}</p>
      )}

      {/* 操作列 */}
      {!editing && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          {loggedIn && (
            <button
              type="button"
              onClick={() => setReplying((v) => !v)}
              className="font-medium text-cobalt hover:underline"
            >
              {replying ? "收起回覆" : "回覆"}
            </button>
          )}
          {mine && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="font-medium text-ink/50 hover:text-ink hover:underline"
              >
                編輯
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm("確定要刪除這則回覆嗎？其下的回覆會一併刪除。")) return;
                  startTransition(async () => {
                    await deleteOwnForumReply(replyId);
                  });
                }}
                className="font-medium text-blush hover:underline disabled:opacity-50"
              >
                {pending ? "刪除中…" : "刪除"}
              </button>
            </>
          )}
          {state.success && (
            <span className="text-emerald-600">{state.success} ✓</span>
          )}
        </div>
      )}

      {replying && (
        <div className="mt-2">
          <ReplyForm
            postId={postId}
            parentId={replyTargetId}
            compact
            onSuccess={() => setReplying(false)}
          />
        </div>
      )}
    </div>
  );
}
