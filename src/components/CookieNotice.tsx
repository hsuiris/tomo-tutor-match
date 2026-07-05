"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

// Cookie 使用告知：本站只用必要 cookie（登入 session），
// 依個資法採告知＋關閉即可，不需逐類別勾選的同意管理
const STORAGE_KEY = "cookie-notice-dismissed";

const noopSubscribe = () => () => {};
// server 端一律當作已讀（不渲染），client 掛載後依 localStorage 決定
const getSnapshot = () => !!localStorage.getItem(STORAGE_KEY);
const getServerSnapshot = () => true;

export default function CookieNotice() {
  const dismissed = useSyncExternalStore(noopSubscribe, getSnapshot, getServerSnapshot);
  const [closed, setClosed] = useState(false);

  if (dismissed || closed) return null;

  return (
    <div
      role="region"
      aria-label="Cookie 使用告知"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-2 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-ink/80">
          本網站使用必要 Cookie 維持登入狀態與基本功能，繼續瀏覽即表示你同意。詳見
          <Link href="/privacy" className="mx-1 underline hover:text-ink">
            隱私權政策
          </Link>
          。
        </p>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setClosed(true);
          }}
          className="shrink-0 rounded-full bg-ink px-5 py-2 text-sm font-medium text-white hover:bg-ink/85"
        >
          我知道了
        </button>
      </div>
    </div>
  );
}
