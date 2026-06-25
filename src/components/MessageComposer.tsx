"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/messages/actions";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function MessageComposer({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(sendMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // 送出成功後清空輸入並刷新訊息
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex items-center gap-2 border-t border-line/15 bg-paper p-3"
    >
      <input type="hidden" name="conversationId" value={conversationId} />
      <input
        name="body"
        autoComplete="off"
        placeholder="輸入訊息…"
        className="flex-1 rounded-full border border-line px-4 py-2 text-sm outline-none focus:border-line"
      />
      <button
        type="submit"
        className="rounded-full bg-sun px-5 py-2 text-sm font-bold text-paper hover:bg-sun/80"
      >
        送出
      </button>
    </form>
  );
}
