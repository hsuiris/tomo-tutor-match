"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 每隔數秒重新整理伺服器元件以收取新訊息（輕量輪詢，免 websocket）
// 分頁在背景時暫停，切回來立即刷新一次
export default function ChatPoller({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) router.refresh();
    }, intervalMs);
    const onVisible = () => {
      if (!document.hidden) router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, intervalMs]);
  return null;
}
