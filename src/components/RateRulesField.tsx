"use client";

import { useState } from "react";
import { levelsForSubject } from "@/lib/constants";
import type { RateRule } from "@/lib/profile-detail";

// 各科目/年級客製時薪；科目選項連動主表單已選的專長科目
export default function RateRulesField({
  subjects,
  initial,
}: {
  subjects: string[];
  initial: RateRule[];
}) {
  const [rows, setRows] = useState<RateRule[]>(initial);

  const update = (i: number, patch: Partial<RateRule>) =>
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  // 有效規則：科目必須仍在專長內、有填時薪
  const clean = rows.filter(
    (r) => r.subject && subjects.includes(r.subject) && r.rate > 0
  );

  return (
    <div className="space-y-2">
      <input type="hidden" name="rateRules" value={JSON.stringify(clean)} />
      {subjects.length === 0 && (
        <p className="text-xs text-ink/40">請先於上方選擇專長科目，才能設定各科時薪。</p>
      )}
      {rows.map((r, i) => {
        const levelOpts = r.subject ? levelsForSubject(r.subject) : [];
        return (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-line/60 p-2"
          >
            <select
              value={r.subject}
              onChange={(e) =>
                // 換科目後清掉不相容的年級
                update(i, { subject: e.target.value, level: undefined })
              }
              className="w-28 rounded-xl border border-line bg-white px-2 py-2 text-sm outline-none focus:bg-sun-soft/30"
            >
              <option value="">科目</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={r.level ?? ""}
              onChange={(e) => update(i, { level: e.target.value || undefined })}
              disabled={!r.subject}
              className="w-28 rounded-xl border border-line bg-white px-2 py-2 text-sm outline-none focus:bg-sun-soft/30 disabled:opacity-50"
            >
              <option value="">不分年級</option>
              {levelOpts.map((lv) => (
                <option key={lv} value={lv}>
                  {lv}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <span className="text-xs text-ink/50">NT$</span>
              <input
                type="number"
                min={0}
                value={r.rate || ""}
                onChange={(e) => update(i, { rate: Number(e.target.value) })}
                placeholder="時薪"
                className="w-20 rounded-xl border border-line bg-white px-2 py-2 text-sm outline-none focus:bg-sun-soft/30"
              />
              <span className="text-ink/40">–</span>
              <input
                type="number"
                min={0}
                value={r.rateMax || ""}
                onChange={(e) =>
                  update(i, { rateMax: e.target.value ? Number(e.target.value) : undefined })
                }
                placeholder="上限"
                className="w-20 rounded-xl border border-line bg-white px-2 py-2 text-sm outline-none focus:bg-sun-soft/30"
              />
            </div>
            <button
              type="button"
              aria-label="移除"
              onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
              className="ml-auto shrink-0 rounded-full px-2 py-1 text-ink/40 hover:text-blush"
            >
              ✕
            </button>
          </div>
        );
      })}
      <button
        type="button"
        disabled={subjects.length === 0}
        onClick={() =>
          setRows([...rows, { subject: "", rate: 0 }])
        }
        className="rounded-full border border-dashed border-line px-4 py-1.5 text-sm font-medium text-ink/60 hover:bg-sun-soft/30 disabled:opacity-50"
      >
        ＋ 新增科目時薪
      </button>
    </div>
  );
}
