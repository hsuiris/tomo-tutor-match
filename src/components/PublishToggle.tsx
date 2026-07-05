"use client";

import { useTransition } from "react";
import { setProfilePublished } from "@/app/dashboard/actions";

// 面板上的接案狀態切換：避免老師檔案一直掛著公開卻已不接案
export default function PublishToggle({ published }: { published: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-5 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              published ? "bg-emerald-500" : "bg-ink/25"
            }`}
          />
          <span className="font-bold text-ink">
            {published ? "公開接案中" : "已關閉接案"}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink/50">
          {published
            ? "你的檔案會出現在找老師列表，家長可聯繫你"
            : "檔案已下架，不會被搜尋到；隨時可重新開放"}
        </p>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => setProfilePublished(!published))}
        className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${
          published
            ? "border border-line text-ink/70 hover:bg-blushbg/40 hover:text-blush"
            : "bg-sun text-paper hover:bg-sun-dark"
        }`}
      >
        {pending ? "更新中…" : published ? "關閉接案" : "開放接案"}
      </button>
    </div>
  );
}
