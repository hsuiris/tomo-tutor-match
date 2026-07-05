"use client";

import { useState } from "react";
import { EXAM_TYPES, type ExamScore } from "@/lib/profile-detail";

// 成績列表（會考/學測/指考/多益…），序列化進 hidden input
export default function ExamScoresField({ initial }: { initial: ExamScore[] }) {
  const [rows, setRows] = useState<ExamScore[]>(initial);

  const update = (i: number, patch: Partial<ExamScore>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const clean = rows.filter((r) => r.type && r.score.trim());

  return (
    <div className="space-y-2">
      <input type="hidden" name="exams" value={JSON.stringify(clean)} />
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={r.type}
            onChange={(e) => update(i, { type: e.target.value })}
            className="w-40 shrink-0 rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:bg-sun-soft/30"
          >
            <option value="">選擇項目</option>
            {EXAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            value={r.score}
            onChange={(e) => update(i, { score: e.target.value })}
            placeholder="成績，如 5A++／滿級分／960"
            className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:bg-sun-soft/30"
          />
          <button
            type="button"
            aria-label="移除"
            onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
            className="shrink-0 rounded-full px-2 py-1 text-ink/40 hover:text-blush"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows([...rows, { type: "", score: "" }])}
        className="rounded-full border border-dashed border-line px-4 py-1.5 text-sm font-medium text-ink/60 hover:bg-sun-soft/30"
      >
        ＋ 新增成績
      </button>
    </div>
  );
}
