"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  SUBJECTS,
  REGIONS,
  MODE_LABELS,
  GENDER_OPTIONS,
  MATCH_PRIORITIES,
  levelsForSubject,
  type TeachingMode,
} from "@/lib/constants";

type Defaults = {
  subject?: string;
  level?: string;
  region?: string;
  budget?: string;
  mode?: string;
  gender?: string;
  priority?: string;
};

// compact：首頁 Hero 用的精簡版（科目／地區／預算 + 配對按鈕）
// full：智能匹配頁的完整版
export default function MatchForm({
  variant = "full",
  defaults = {},
}: {
  variant?: "full" | "compact";
  defaults?: Defaults;
}) {
  const router = useRouter();

  const [subject, setSubject] = useState(defaults.subject ?? "");
  const [level, setLevel] = useState(defaults.level ?? "");
  const [region, setRegion] = useState(defaults.region ?? "");
  const [budget, setBudget] = useState(defaults.budget ?? "");
  const [mode, setMode] = useState(defaults.mode ?? "");
  const [gender, setGender] = useState(defaults.gender ?? "");
  const [priority, setPriority] = useState(defaults.priority ?? "balanced");

  // 年級／程度選項依科目而定（技能類用 入門/初階/進階）
  const levelOptions = levelsForSubject(subject);
  function changeSubject(val: string) {
    setSubject(val);
    const allowed = new Set(levelsForSubject(val));
    setLevel((cur) => (allowed.has(cur) ? cur : ""));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (level) params.set("level", level);
    if (region) params.set("region", region);
    if (budget) params.set("budget", budget);
    if (mode) params.set("mode", mode);
    if (gender) params.set("gender", gender);
    if (priority && priority !== "balanced") params.set("priority", priority);
    router.push(`/match?${params.toString()}`);
  }

  const fieldCls =
    "w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm font-bold outline-none focus:bg-sun-soft/40";
  const labelCls = "mb-1.5 block text-xs font-bold text-ink/60";

  if (variant === "compact") {
    return (
      <form
        onSubmit={submit}
        className="grid gap-3 rounded-2xl border border-line bg-paper p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
      >
        <div>
          <label className={labelCls}>科目</label>
          <select
            value={subject}
            onChange={(e) => changeSubject(e.target.value)}
            className={fieldCls}
          >
            <option value="">請選擇科目</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>地區</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={fieldCls}
          >
            <option value="">不限地區</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>預算（每小時）</label>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            type="number"
            min={0}
            placeholder="NT$ 上限"
            className={fieldCls}
          />
        </div>
        <button
          type="submit"
          className="rounded-xl border border-line bg-sun px-6 py-2.5 text-sm font-bold text-paper transition hover:bg-sun-dark"
        >
          ✨ 幫我配對
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-2xl border border-line bg-paper p-5 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>
            科目 <span className="text-blush">*</span>
          </label>
          <select
            value={subject}
            onChange={(e) => changeSubject(e.target.value)}
            className={fieldCls}
          >
            <option value="">請選擇科目</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>年級／程度</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={fieldCls}
          >
            <option value="">不限</option>
            {levelOptions.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>地區</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={fieldCls}
          >
            <option value="">不限地區</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>預算（每小時上限）</label>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            type="number"
            min={0}
            placeholder="NT$"
            className={fieldCls}
          />
        </div>
        <div>
          <label className={labelCls}>授課方式</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className={fieldCls}
          >
            <option value="">不限</option>
            {(["ONLINE", "IN_PERSON", "BOTH"] as TeachingMode[]).map((m) => (
              <option key={m} value={m}>
                {MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>老師性別偏好</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={fieldCls}
          >
            <option value="">不限</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>你最在意什麼？（影響配對權重）</label>
        <div className="flex flex-wrap gap-2">
          {MATCH_PRIORITIES.map((p) => {
            const on = priority === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                title={p.hint}
                className={`rounded-full border border-line px-4 py-1.5 text-sm font-bold transition ${
                  on ? "bg-sun text-paper" : "bg-paper text-ink/70 hover:bg-sun-soft/40"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-full border border-line bg-sun px-6 py-3 text-base font-bold text-paper transition hover:bg-sun-dark sm:w-auto"
      >
        ✨ 開始智能配對
      </button>
    </form>
  );
}
