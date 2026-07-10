"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SUBJECTS } from "@/lib/constants";
import RegionOptions from "@/components/RegionOptions";

// 首頁 Hero 的快速搜尋：科目／地區／預算 → 帶入「找老師」頁的篩選條件
export default function TutorQuickSearch() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [region, setRegion] = useState("");
  const [budget, setBudget] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (region) params.set("region", region);
    if (budget) params.set("max", budget); // 預算上限對應 /tutors 的時薪上限篩選
    const qs = params.toString();
    router.push(qs ? `/tutors?${qs}` : "/tutors");
  }

  const fieldCls =
    "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-bold outline-none focus:bg-sun-soft/40";
  const labelCls = "mb-1.5 block text-xs font-bold text-ink/60";

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-2xl border border-line bg-paper p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
    >
      <div>
        <label className={labelCls}>科目</label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
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
          <RegionOptions />
        </select>
      </div>
      <div>
        <label className={labelCls}>預算（每小時上限）</label>
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
        搜尋老師
      </button>
    </form>
  );
}
