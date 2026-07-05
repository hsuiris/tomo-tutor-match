"use client";

import { useState } from "react";
import {
  WEEKDAYS,
  type Availability,
  type AvailabilitySlot,
} from "@/lib/profile-detail";

const HOURS = Array.from({ length: 25 }, (_, i) => i); // 0..24

// 可配合上課時間：時段列表，或選「再私訊討論」
export default function AvailabilityField({
  initial,
}: {
  initial: Availability | null;
}) {
  const [discuss, setDiscuss] = useState(
    initial?.mode === "discuss" || initial == null
  );
  const [slots, setSlots] = useState<AvailabilitySlot[]>(
    initial?.mode === "slots" ? initial.slots : []
  );

  const value: Availability = discuss
    ? { mode: "discuss" }
    : { mode: "slots", slots: slots.filter((s) => s.days.length) };

  const update = (i: number, patch: Partial<AvailabilitySlot>) =>
    setSlots(slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const toggleDay = (i: number, d: string) => {
    const s = slots[i];
    const days = s.days.includes(d)
      ? s.days.filter((x) => x !== d)
      : [...s.days, d];
    update(i, { days });
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name="availability" value={JSON.stringify(value)} />

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          checked={discuss}
          onChange={(e) => setDiscuss(e.target.checked)}
          className="accent-ink"
        />
        時間彈性，配對後再私訊討論
      </label>

      {!discuss && (
        <div className="space-y-3">
          {slots.map((s, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-line/60 p-3">
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i, d)}
                    className={`h-9 w-9 rounded-full text-sm font-bold transition ${
                      s.days.includes(d)
                        ? "bg-sun text-paper"
                        : "border border-line text-ink/60 hover:bg-sun-soft/40"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <select
                  value={s.start}
                  onChange={(e) => update(i, { start: Number(e.target.value) })}
                  className="rounded-xl border border-line bg-white px-2 py-2 outline-none focus:bg-sun-soft/30"
                >
                  {HOURS.slice(0, 24).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
                <span className="text-ink/40">至</span>
                <select
                  value={s.end}
                  onChange={(e) => update(i, { end: Number(e.target.value) })}
                  className="rounded-xl border border-line bg-white px-2 py-2 outline-none focus:bg-sun-soft/30"
                >
                  {HOURS.slice(1).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
                <span className="ml-1 text-ink/50">每次</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={s.hours ?? ""}
                  onChange={(e) =>
                    update(i, {
                      hours: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="—"
                  className="w-16 rounded-xl border border-line bg-white px-2 py-2 outline-none focus:bg-sun-soft/30"
                />
                <span className="text-ink/50">小時</span>
                <button
                  type="button"
                  aria-label="移除時段"
                  onClick={() => setSlots(slots.filter((_, idx) => idx !== i))}
                  className="ml-auto rounded-full px-2 py-1 text-ink/40 hover:text-blush"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setSlots([...slots, { days: [], start: 18, end: 21 }])
            }
            className="rounded-full border border-dashed border-line px-4 py-1.5 text-sm font-medium text-ink/60 hover:bg-sun-soft/30"
          >
            ＋ 新增時段
          </button>
        </div>
      )}
    </div>
  );
}
