import Link from "next/link";
import type { ChecklistItem } from "@/lib/tutor-publish";

// 老師檔案完成度 nudge：列出待補齊項目 + 進度，引導到編輯頁。
// 只在檔案未完整時顯示（由 dashboard 判斷是否 render）。
export default function ProfileChecklist({ items }: { items: ChecklistItem[] }) {
  const done = items.filter((i) => i.done).length;
  const requiredMissing = items.some((i) => i.required && !i.done);

  return (
    <div className="rounded-xl border border-line bg-paper px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-ink">檔案完成度</span>
        <span className="text-sm font-bold text-ink/50">
          {done}/{items.length}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-sun transition-all"
          style={{ width: `${(done / items.length) * 100}%` }}
        />
      </div>

      <ul className="mt-3 space-y-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2 text-sm">
            <span className={it.done ? "text-emerald-500" : "text-ink/30"}>
              {it.done ? "✓" : "○"}
            </span>
            <span className={it.done ? "text-ink/40 line-through" : "font-bold text-ink/80"}>
              {it.label}
              {it.required && !it.done && (
                <span className="ml-1 text-xs text-blush">（上架必填）</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs font-medium text-ink/55">
        {requiredMissing
          ? "補齊必填欄位才能開放接案；越完整越容易被家長選中。"
          : "檔案越完整越容易被家長選中，也更容易通過認證。"}
      </p>
      <Link
        href="/dashboard/profile"
        className="mt-3 inline-block rounded-full border border-line bg-sun px-5 py-2 text-sm font-bold text-paper transition hover:bg-sun-dark"
      >
        繼續完善檔案 →
      </Link>
    </div>
  );
}
