"use client";

import { usePathname, useRouter } from "next/navigation";

// 全站返回鍵：掛在 root layout，首頁不顯示。
// 有瀏覽紀錄退回上一頁；直接落地（無紀錄）時回首頁。
export default function GoBack() {
  const router = useRouter();
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <button
        type="button"
        onClick={() =>
          window.history.length > 1 ? router.back() : router.push("/")
        }
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-bold text-ink/70 transition hover:bg-sun-soft/60 hover:text-ink"
      >
        <span aria-hidden>←</span>
        返回
      </button>
    </div>
  );
}
