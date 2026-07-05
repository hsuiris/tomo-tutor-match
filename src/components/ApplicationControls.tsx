"use client";

import { useActionState, useState, useTransition } from "react";
import { cancelApplication, updateApplication } from "@/app/jobs/actions";
import { SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

// 自己的應徵：編輯訊息 + 取消應徵（僅 PENDING 時由頁面渲染）
export default function ApplicationControls({
  applicationId,
  message,
}: {
  applicationId: string;
  message: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction] = useActionState(updateApplication, initialState);
  const [pending, startTransition] = useTransition();

  if (editing && !state.success) {
    return (
      <form action={formAction} className="mt-3 space-y-2">
        <input type="hidden" name="applicationId" value={applicationId} />
        <textarea
          name="message"
          rows={4}
          defaultValue={message}
          className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm outline-none focus:bg-sun-soft/30"
        />
        {state.fieldErrors?.message?.map((e) => (
          <p key={e} className="text-xs text-red-500">
            {e}
          </p>
        ))}
        {state.error && <p className="text-xs text-red-500">{state.error}</p>}
        <div className="flex gap-2">
          <SubmitButton fullWidth={false}>儲存</SubmitButton>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-full border border-line px-5 py-2 text-sm font-medium text-ink/60 hover:bg-sun-soft/40"
          >
            取消編輯
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {state.success && (
        <span className="text-xs text-emerald-600">{state.success} ✓</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink/70 hover:bg-sun-soft/40"
      >
        編輯應徵訊息
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("確定要取消應徵嗎？取消後可重新應徵。")) return;
          startTransition(() => cancelApplication(applicationId));
        }}
        className="rounded-full border border-line px-4 py-2 text-sm font-medium text-blush hover:bg-blushbg/40 disabled:opacity-50"
      >
        {pending ? "取消中…" : "取消應徵"}
      </button>
    </div>
  );
}
