"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/app/forum/actions";
import { SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function NewPostForm({ board }: { board: "TUTOR" | "PARENT" }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createPost, initialState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state.redirectTo) router.push(state.redirectTo);
  }, [state.redirectTo, router]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-sun px-4 py-2 text-sm font-bold text-paper hover:bg-sun/80"
      >
        發表主題
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl border border-line bg-paper p-5"
    >
      <input type="hidden" name="board" value={board} />
      <div>
        <input
          name="title"
          placeholder="主題標題"
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
        />
        {state.fieldErrors?.title?.map((e) => (
          <p key={e} className="mt-1 text-xs text-red-500">
            {e}
          </p>
        ))}
      </div>
      <div>
        <textarea
          name="body"
          rows={4}
          placeholder="分享你的問題或經驗…"
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
        />
        {state.fieldErrors?.body?.map((e) => (
          <p key={e} className="mt-1 text-xs text-red-500">
            {e}
          </p>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" name="anonymous" className="accent-ink" />
        匿名發表
      </label>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <div className="flex gap-2">
        <SubmitButton>發佈</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-line px-4 py-2 text-sm text-ink/70 hover:bg-sun-soft/40"
        >
          取消
        </button>
      </div>
    </form>
  );
}
