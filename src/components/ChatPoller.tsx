"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 每隔數秒重新整理伺服器元件以收取新訊息（輕量輪詢，免 websocket）
export default function ChatPoller({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);
  return null;
}
