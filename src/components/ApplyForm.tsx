"use client";

import { useActionState } from "react";
import Link from "next/link";
import { applyToJob } from "@/app/jobs/actions";
import { SubmitButton, useFocusFirstError } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function ApplyForm({ jobId }: { jobId: string }) {
  const [state, formAction] = useActionState(applyToJob, initialState);
  useFocusFirstError(state);

  if (state.success) {
    return (
      <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
        {state.success} ✓ 學生看到後會與你聯繫，可到{" "}
        <Link href="/favorites" className="font-bold underline">
          我的收藏
        </Link>{" "}
        隨時追蹤。
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="jobId" value={jobId} />
      <textarea
        name="message"
        rows={4}
        placeholder="向學生介紹你自己,說明你能如何幫助達成學習目標"
        defaultValue={state.values?.message}
        className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
      />
      {state.fieldErrors?.message?.length ? (
        state.fieldErrors.message.map((e) => (
          <p key={e} className="text-xs text-red-500">
            {e}
          </p>
        ))
      ) : (
        <p className="text-xs text-ink/40">至少 5 個字</p>
      )}
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      <SubmitButton>送出應徵</SubmitButton>
    </form>
  );
}
