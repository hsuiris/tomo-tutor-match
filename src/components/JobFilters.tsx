"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SUBJECTS, ALL_LEVELS, GENDER_OPTIONS } from "@/lib/constants";
import RegionPicker from "@/components/RegionPicker";

export default function JobFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const [subjects, setSubjects] = useState<string[]>(sp.getAll("subject"));
  const [levels, setLevels] = useState<string[]>(sp.getAll("level"));
  const [regions, setRegions] = useState<string[]>(sp.getAll("region"));
  const [gender, setGender] = useState(sp.get("gender") ?? "");

  function apply(overrides?: {
    subjects?: string[];
    levels?: string[];
    regions?: string[];
    gender?: string;
  }) {
    const next = { subjects, levels, regions, gender, ...overrides };
    const params = new URLSearchParams();
    next.subjects.forEach((s) => params.append("subject", s));
    next.levels.forEach((l) => params.append("level", l));
    next.regions.forEach((r) => params.append("region", r));
    if (next.gender) params.set("gender", next.gender);
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : "/jobs");
  }

  function toggle(key: "subjects" | "levels" | "regions", value: string) {
    const current = { subjects, levels, regions }[key];
    const setter = {
      subjects: setSubjects,
      levels: setLevels,
      regions: setRegions,
    }[key];
    const nextList = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setter(nextList);
    apply({ [key]: nextList });
  }

  const hasFilter =
    subjects.length || levels.length || regions.length || gender;

  return (
    <div className="space-y-4 rounded-xl border border-line bg-paper p-5">
      <PillRow
        label="科目（可複選）"
        options={SUBJECTS}
        selected={subjects}
        onToggle={(v) => toggle("subjects", v)}
      />
      <PillRow
        label="年級／程度（可複選）"
        options={ALL_LEVELS}
        selected={levels}
        onToggle={(v) => toggle("levels", v)}
      />
      <div>
        <label className="mb-2 block text-xs font-bold text-ink/60">
          地區（可複選）
        </label>
        <RegionPicker
          value={regions}
          onChange={(next) => {
            setRegions(next);
            apply({ regions: next });
          }}
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-ink/60">
            學生性別
          </label>
          <select
            value={gender}
            onChange={(e) => {
              setGender(e.target.value);
              apply({ gender: e.target.value });
            }}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium outline-none focus:bg-sun-soft/40"
          >
            <option value="">不限</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                學生{g.label}
              </option>
            ))}
          </select>
        </div>

        {hasFilter ? (
          <button
            type="button"
            onClick={() => {
              setSubjects([]);
              setLevels([]);
              setRegions([]);
              setGender("");
              router.push("/jobs");
            }}
            className="text-xs font-bold text-ink/50 underline underline-offset-2 hover:text-ink"
          >
            清除全部條件
          </button>
        ) : null}
      </div>
    </div>
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
