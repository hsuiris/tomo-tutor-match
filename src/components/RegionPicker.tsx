"use client";

import { useState } from "react";
import {
  TW_REGIONS,
  ONLINE_REGION,
  districtValue,
  districtValuesOf,
  regionLabel,
} from "@/lib/regions";

// 縣市 → 行政區的階層式多選。受控元件：傳入 value / onChange。
// 傳 name 時額外輸出 hidden input，供 <form> 直接送出（如老師檔案）。
export default function RegionPicker({
  value,
  onChange,
  name,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  name?: string;
}) {
  const [openCity, setOpenCity] = useState<string | null>(null);
  const selected = new Set(value);

  const toggle = (v: string) => {
    const next = new Set(selected);
    next.has(v) ? next.delete(v) : next.add(v);
    onChange([...next]);
  };

  // 某縣市已選的數量（整縣市 token 算 1，加上已選行政區）
  const cityCount = (city: string) =>
    (selected.has(city) ? 1 : 0) +
    districtValuesOf(city).filter((d) => selected.has(d)).length;

  return (
    <div className="space-y-3">
      {name &&
        value.map((v) => <input key={v} type="hidden" name={name} value={v} />)}

      {/* 已選摘要 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => toggle(v)}
              className="inline-flex items-center gap-1 rounded-full bg-sun px-3 py-1 text-sm font-bold text-paper"
            >
              {regionLabel(v)}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}

      {/* 線上 + 縣市列 */}
      <div className="flex flex-wrap gap-1.5">
        <Pill on={selected.has(ONLINE_REGION)} onClick={() => toggle(ONLINE_REGION)}>
          {ONLINE_REGION}
        </Pill>
        {TW_REGIONS.map(({ city }) => {
          const count = cityCount(city);
          return (
            <Pill
              key={city}
              on={count > 0}
              onClick={() => setOpenCity(openCity === city ? null : city)}
            >
              {city}
              {count > 0 && `（${count}）`}
              <span className="ml-0.5 text-xs opacity-60">
                {openCity === city ? "▲" : "▾"}
              </span>
            </Pill>
          );
        })}
      </div>

      {/* 展開的縣市：全縣市 + 各行政區 */}
      {openCity && (
        <div className="rounded-xl border border-line bg-sun-soft/20 p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Pill on={selected.has(openCity)} onClick={() => toggle(openCity)}>
              全 {openCity}
            </Pill>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TW_REGIONS.find((r) => r.city === openCity)!.districts.map((d) => {
              const v = districtValue(openCity, d);
              return (
                <Pill key={v} on={selected.has(v)} onClick={() => toggle(v)}>
                  {d}
                </Pill>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border border-line px-3 py-1 text-sm font-bold transition ${
        on ? "bg-sun text-paper" : "bg-paper text-ink/70 hover:bg-sun-soft/40"
      }`}
    >
      {children}
    </button>
  );
}
