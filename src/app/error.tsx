"use client";

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // 進 Vercel logs，之後接 Sentry 也是掛這裡
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <h1 className="font-serif text-2xl font-bold text-ink">出了點問題</h1>
      <p className="mt-2 text-ink/60">
        很抱歉，頁面載入時發生錯誤。請再試一次，若持續發生請聯絡我們。
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-ink/40">錯誤代碼：{error.digest}</p>
      )}
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="mt-8 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white hover:bg-ink/85"
      >
        再試一次
      </button>
    </div>
  );
}
