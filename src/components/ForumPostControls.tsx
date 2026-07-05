"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateForumPost, deleteOwnForumPost } from "@/app/forum/actions";
import { SubmitButton, useFocusFirstError } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

// 自己的貼文：編輯（標題+內容）與刪除
export default function ForumPostControls({
  postId,
  title,
  body,
}: {
  postId: string;
  title: string;
  body: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(updateForumPost, initialState);
  const [pending, startTransition] = useTransition();
  useFocusFirstError(state);

  if (editing && !state.success) {
    return (
      <form action={formAction} className="mt-4 space-y-2 border-t border-line/60 pt-4">
        <input type="hidden" name="postId" value={postId} />
        <input
          name="title"
          defaultValue={title}
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
        />
        {state.fieldErrors?.title?.map((e) => (
          <p key={e} className="text-xs text-red-500">{e}</p>
        ))}
        <textarea
          name="body"
          rows={5}
          defaultValue={body}
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
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
    );
  }

  return (
    <div className="mt-4 flex items-center gap-2 border-t border-line/60 pt-3">
      {state.success && (
        <span className="text-xs text-emerald-600">{state.success} ✓</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-ink/70 hover:bg-sun-soft/40"
      >
        編輯貼文
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("確定要刪除這篇貼文嗎？所有回覆會一併刪除。")) return;
          startTransition(async () => {
            const res = await deleteOwnForumPost(postId);
            if (res.redirectTo) router.push(res.redirectTo);
          });
        }}
        className="rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-blush hover:bg-blushbg/40 disabled:opacity-50"
      >
        {pending ? "刪除中…" : "刪除貼文"}
      </button>
    </div>
  );
}
