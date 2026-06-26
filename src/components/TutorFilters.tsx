"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  SUBJECTS,
  LEVELS,
  REGIONS,
  EDU_LEVELS,
  SORT_OPTIONS,
  GENDER_OPTIONS,
} from "@/lib/constants";

export default function TutorFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [subjects, setSubjects] = useState<string[]>(sp.getAll("subject"));
  const [levels, setLevels] = useState<string[]>(sp.getAll("level"));
  const [regions, setRegions] = useState<string[]>(sp.getAll("region"));
  const [eduLevels, setEduLevels] = useState<string[]>(sp.getAll("edu"));
  const [university, setUniversity] = useState(sp.get("uni") ?? "");
  const [min, setMin] = useState(sp.get("min") ?? "");
  const [max, setMax] = useState(sp.get("max") ?? "");
  const [gender, setGender] = useState(sp.get("gender") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "recommended");

  // 用最新的值組出網址並導航（重設回第 1 頁）
  function apply(overrides?: {
    subjects?: string[];
    levels?: string[];
    regions?: string[];
    eduLevels?: string[];
    gender?: string;
    sort?: string;
  }) {
    const next = {
      q,
      subjects,
      levels,
      regions,
      eduLevels,
      university,
      min,
      max,
      gender,
      sort,
      ...overrides,
    };
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    next.subjects.forEach((s) => params.append("subject", s));
    next.levels.forEach((l) => params.append("level", l));
    next.regions.forEach((r) => params.append("region", r));
    next.eduLevels.forEach((e) => params.append("edu", e));
    if (next.university) params.set("uni", next.university);
    if (next.min) params.set("min", next.min);
    if (next.max) params.set("max", next.max);
    if (next.gender) params.set("gender", next.gender);
    if (next.sort && next.sort !== "recommended") params.set("sort", next.sort);
    const qs = params.toString();
    router.push(qs ? `/tutors?${qs}` : "/tutors");
  }

  // 多選切換：點一下加入、再點一下移除
  function toggle(
    key: "subjects" | "levels" | "regions" | "eduLevels",
    value: string
  ) {
    const current = { subjects, levels, regions, eduLevels }[key];
    const setter = {
      subjects: setSubjects,
      levels: setLevels,
      regions: setRegions,
      eduLevels: setEduLevels,
    }[key];
    const nextList = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setter(nextList);
    apply({ [key]: nextList });
  }

  const hasFilter =
    q ||
    subjects.length ||
    levels.length ||
    regions.length ||
    eduLevels.length ||
    university ||
    min ||
    max ||
    gender ||
    sort !== "recommended";

  const selectCls =
    "rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium outline-none focus:bg-sun-soft/40";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="space-y-4 rounded-xl border border-line bg-paper p-5"
    >
      {/* 第一排：關鍵字 + 時薪 + 性別 + 排序 */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="mb-1 block text-xs font-bold text-ink/60">
            關鍵字
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="老師姓名或自我介紹"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium outline-none placeholder:text-ink/40 focus:bg-sun-soft/40"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-ink/60">
            時薪範圍
          </label>
          <div className="flex items-center gap-1">
            <input
              value={min}
              onChange={(e) => setMin(e.target.value)}
              type="number"
              placeholder="最低"
              className="w-20 rounded-xl border border-line bg-paper px-2 py-2 text-sm font-medium outline-none placeholder:text-ink/40 focus:bg-sun-soft/40"
            />
            <span className="text-ink/40">–</span>
            <input
              value={max}
              onChange={(e) => setMax(e.target.value)}
              type="number"
              placeholder="最高"
              className="w-20 rounded-xl border border-line bg-paper px-2 py-2 text-sm font-medium outline-none placeholder:text-ink/40 focus:bg-sun-soft/40"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-ink/60">
            性別
          </label>
          <select
            value={gender}
            onChange={(e) => {
              setGender(e.target.value);
              apply({ gender: e.target.value });
            }}
            className={selectCls}
          >
            <option value="">不限</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-ink/60">
            排序
          </label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              apply({ sort: e.target.value });
            }}
            className={selectCls}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-full border border-line bg-sun px-6 py-2 text-sm font-bold text-paper transition hover:bg-sun-dark"
        >
          搜尋
        </button>
      </div>

      {/* 多選膠囊：科目／學制／地區 */}
      <PillRow
        label="科目（可複選）"
        options={SUBJECTS}
        selected={subjects}
        onToggle={(v) => toggle("subjects", v)}
      />
      <PillRow
        label="學制（可複選）"
        options={LEVELS}
        selected={levels}
        onToggle={(v) => toggle("levels", v)}
      />
      <PillRow
        label="地區（可複選）"
        options={REGIONS}
        selected={regions}
        onToggle={(v) => toggle("regions", v)}
      />
      <PillRow
        label="教育程度（可複選）"
        options={EDU_LEVELS}
        selected={eduLevels}
        onToggle={(v) => toggle("eduLevels", v)}
      />

      <div className="max-w-xs">
        <label className="mb-1 block text-xs font-bold text-ink/60">
          畢業／就讀大學
        </label>
        <input
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          onBlur={() => apply()}
          placeholder="輸入學校名稱,如 台灣大學"
          className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-medium outline-none placeholder:text-ink/40 focus:bg-sun-soft/40"
        />
      </div>

      {hasFilter ? (
        <button
          type="button"
          onClick={() => {
            setQ("");
            setSubjects([]);
            setLevels([]);
            setRegions([]);
            setEduLevels([]);
            setUniversity("");
            setMin("");
            setMax("");
            setGender("");
            setSort("recommended");
            router.push("/tutors");
          }}
          className="text-xs font-bold text-ink/50 underline underline-offset-2 hover:text-ink"
        >
          清除全部條件
        </button>
      ) : null}
    </form>
  );
}

function PillRow({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-ink/60">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`rounded-full border border-line px-3 py-1 text-sm font-bold transition ${
                on ? "bg-sun text-paper" : "bg-paper text-ink/70 hover:bg-sun-soft/40"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
