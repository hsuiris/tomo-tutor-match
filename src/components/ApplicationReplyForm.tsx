"use client";

import { useActionState, useEffect, useRef } from "react";
import { replyToApplication } from "@/app/jobs/actions";
import { SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

// 應徵討論的回覆框（案主與該應徵老師可見）
export default function ApplicationReplyForm({
  applicationId,
}: {
  applicationId: string;
}) {
  const [state, formAction] = useActionState(replyToApplication, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // 送出成功後清空輸入框
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-2 flex items-start gap-2">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="min-w-0 flex-1">
        <textarea
          name="body"
          rows={1}
          placeholder="回覆⋯"
          className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:bg-sun-soft/30"
        />
        {state.fieldErrors?.body?.map((e) => (
          <p key={e} className="mt-1 text-xs text-red-500">
            {e}
          </p>
        ))}
        {state.error && (
          <p className="mt-1 text-xs text-red-500">{state.error}</p>
        )}
      </div>
      <SubmitButton fullWidth={false}>回覆</SubmitButton>
    </form>
  );
}
