"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 短暫停留（讓使用者看到成功訊息）後自動導頁
export default function AutoRedirect({
  to,
  delayMs = 1500,
}: {
  to: string;
  delayMs?: number;
}) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace(to), delayMs);
    return () => clearTimeout(t);
  }, [router, to, delayMs]);
  return null;
}
