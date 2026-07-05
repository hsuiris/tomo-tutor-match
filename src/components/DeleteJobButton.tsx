"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteOwnJob } from "@/app/jobs/actions";

// 案主刪除自己發布的需求（確認後刪除並回「我發布的需求」）
export default function DeleteJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            "確定要刪除這個需求嗎？所有應徵與討論會一併刪除，已應徵的老師會收到通知。"
          )
        )
          return;
        startTransition(async () => {
          const res = await deleteOwnJob(jobId);
          if (res.redirectTo) router.push(res.redirectTo);
        });
      }}
      className="rounded-full border border-line bg-paper px-4 py-1.5 text-sm font-bold text-blush hover:bg-blushbg/40 disabled:opacity-50"
    >
      {pending ? "刪除中…" : "🗑 刪除需求"}
    </button>
  );
}
