"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createReply } from "@/app/forum/actions";
import { SubmitButton, useFocusFirstError } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

// 主回覆框；帶 parentId 即為巢狀回覆（compact 供留言底下展開用）
export default function ReplyForm({
  postId,
  parentId,
  compact = false,
  onSuccess,
}: {
  postId: string;
  parentId?: string;
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(createReply, initialState);
  useFocusFirstError(state);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      router.refresh();
      onSuccess?.();
    }
  }, [state, router, onSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={
        compact
          ? "space-y-2 rounded-xl border border-line/70 bg-sun-soft/20 p-3"
          : "space-y-2 rounded-2xl border border-line bg-paper p-4"
      }
    >
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <textarea
        name="body"
        rows={compact ? 2 : 3}
        placeholder={parentId ? "回覆這則留言…" : "寫下你的回覆…"}
        defaultValue={state.values?.body}
        autoFocus={compact}
        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line"
      />
      {state.fieldErrors?.body?.map((e) => (
        <p key={e} className="text-xs text-red-500">
          {e}
        </p>
      ))}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            name="anonymous"
            className="accent-ink"
          />
          匿名回覆
        </label>
        <SubmitButton fullWidth={false}>送出回覆</SubmitButton>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
    </form>
  );
}
