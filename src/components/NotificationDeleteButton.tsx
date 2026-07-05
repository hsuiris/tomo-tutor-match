"use client";

import { useTransition } from "react";
import { deleteNotification } from "@/app/messages/actions";

// 通知列右側的刪除鈕；通知列可能包在 Link 裡，要擋住導轉
export default function NotificationDeleteButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label="刪除通知"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(() => deleteNotification(id));
      }}
      className="shrink-0 rounded-full px-2 py-1 text-sm text-ink/35 transition hover:bg-blushbg/50 hover:text-blush disabled:opacity-50"
    >
      ✕
    </button>
  );
}
