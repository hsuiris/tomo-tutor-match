"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createReply } from "@/app/forum/actions";
import { SubmitButton, useFocusFirstError } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function ReplyForm({ postId }: { postId: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createReply, initialState);
  useFocusFirstError(state);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      ref={ref}
      action={formAction}
      className="space-y-2 rounded-2xl border border-line bg-paper p-4"
    >
      <input type="hidden" name="postId" value={postId} />
      <textarea
        name="body"
        rows={3}
        placeholder="寫下你的回覆…"
        defaultValue={state.values?.body}
        className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
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
        <SubmitButton>送出回覆</SubmitButton>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
    </form>
  );
}
