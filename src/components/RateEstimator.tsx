"use client";

import { useMemo, useState } from "react";
import {
  SUBJECTS,
  EDU_LEVELS,
  levelsForSubjects,
} from "@/lib/constants";
import {
  estimateRate,
  type MarketData,
  type EstimateInput,
} from "@/lib/estimate";

type Account = {
  idVerified: boolean;
  bgCheckVerified: boolean;
  eduVerified: boolean;
  ratingAvg: number;
  ratingCount: number;
  currentRate: number | null;
};

export default function RateEstimator({
  market,
  defaults,
  account,
}: {
  market: MarketData;
  defaults: {
    subjects: string[];
    levels: string[];
    experienceYears: number;
    eduLevel: string | null;
  };
  account: Account;
}) {
  const [subjects, setSubjects] = useState<string[]>(defaults.subjects);
  const [levels, setLevels] = useState<string[]>(defaults.levels);
  const [years, setYears] = useState<number>(defaults.experienceYears);
  const [eduLevel, setEduLevel] = useState<string>(defaults.eduLevel ?? "");

  // 程度選項依所選科目而定（技能類用 入門/初階/進階）
  const levelOptions = useMemo(() => levelsForSubjects(subjects), [subjects]);

  // 切換科目時，連帶移除已不適用的程度選項
  const toggleSubject = (v: string) => {
    setSubjects((cur) => {
      const next = cur.includes(v)
        ? cur.filter((x) => x !== v)
        : [...cur, v];
      const allowed = new Set(levelsForSubjects(next));
      setLevels((ls) => ls.filter((l) => allowed.has(l)));
      return next;
    });
  };

  const input: EstimateInput = useMemo(
    () => ({
      subjects,
      levels,
      experienceYears: years,
      eduLevel: eduLevel || null,
      idVerified: account.idVerified,
      bgCheckVerified: account.bgCheckVerified,
      eduVerified: account.eduVerified,
      ratingAvg: account.ratingAvg,
      ratingCount: account.ratingCount,
    }),
    [subjects, levels, years, eduLevel, account]
  );

  const est = useMemo(() => estimateRate(input, market), [input, market]);

  const ready = subjects.length > 0 && levels.length > 0;

  // 與目前定價比較
  let verdict: { text: string; cls: string } | null = null;
  if (account.currentRate != null && ready) {
    if (account.currentRate < est.low)
      verdict = {
        text: `你目前定價 NT$${account.currentRate}，低於建議區間，有調漲空間。`,
        cls: "bg-sun-soft text-ink",
      };
    else if (account.currentRate > est.high)
      verdict = {
        text: `你目前定價 NT$${account.currentRate}，高於建議區間，留意是否影響詢問量。`,
        cls: "bg-blushbg text-ink",
      };
    else
      verdict = {
        text: `你目前定價 NT$${account.currentRate}，落在建議區間內，定價合理。`,
        cls: "bg-mint/20 text-ink",
      };
  }

  return (
    <div className="rounded-2xl border border-line bg-paper p-6 shadow-card">
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-line bg-sun px-3 py-1 text-xs font-extrabold text-paper">
          ✨ AI 行情估算
        </span>
      </div>
      <h2 className="mt-3 font-serif text-2xl font-extrabold text-ink">
        估算你的合理時薪
      </h2>
      <p className="mt-1.5 text-sm text-ink/60">
        以平台真實行情為基準，依你的科目、年級、經驗與條件即時計算建議定價。
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {/* 左：輸入 */}
        <div className="space-y-4">
          <PillField
            label="教學科目（會的技能）"
            options={SUBJECTS}
            selected={subjects}
            onToggle={toggleSubject}
          />
          <PillField
            label="可教年級／程度"
            options={levelOptions}
            selected={levels}
            onToggle={(v) =>
              setLevels((cur) =>
                cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
              )
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">
                教學經驗（年）
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={years}
                onChange={(e) => setYears(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-bold outline-none focus:bg-sun-soft/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-ink/60">
                最高學歷
              </label>
              <select
                value={eduLevel}
                onChange={(e) => setEduLevel(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-bold outline-none focus:bg-sun-soft/40"
              >
                <option value="">未填</option>
                {EDU_LEVELS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 右：結果 */}
        <div className="rounded-2xl border border-line bg-sun-soft/30 p-5">
          {!ready ? (
            <div className="flex h-full min-h-[180px] items-center justify-center text-center text-sm font-bold text-ink/40">
              請至少選擇一個科目與一個年級
            </div>
          ) : (
            <>
              <p className="text-xs font-bold text-ink/50">建議時薪區間</p>
              <p className="mt-1 text-4xl font-extrabold tabular-nums text-ink">
                NT${est.low}
                <span className="mx-1 text-xl text-ink/40">–</span>
                NT${est.high}
              </p>
              <p className="mt-1 text-sm font-bold text-sun">
                建議定價 NT${est.mid} ／ 小時
              </p>
              <p className="mt-1 text-xs text-ink/45">
                市場基準 NT${est.base}
                {est.sampleCount > 0
                  ? `（依 ${est.sampleCount} 組科目×學制平台真實行情）`
                  : est.source === "baseline"
                    ? "（平台樣本不足，採市場公開行情基準）"
                    : "（採概略基準）"}
              </p>

              {/* 加成拆解 */}
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-extrabold text-ink/60">加成拆解</p>
                {est.factors.length === 0 && (
                  <p className="text-xs text-ink/40">無額外加成，採市場基準。</p>
                )}
                {est.factors.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-ink/70">{f.label}</span>
                    <span
                      className={`font-bold tabular-nums ${
                        f.pct >= 0 ? "text-sun" : "text-blush"
                      }`}
                    >
                      {f.pct >= 0 ? "+" : ""}
                      {Math.round(f.pct * 100)}%
                    </span>
                  </div>
                ))}
              </div>

              {verdict && (
                <p
                  className={`mt-4 rounded-xl px-3 py-2 text-xs font-bold ${verdict.cls}`}
                >
                  {verdict.text}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PillField({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
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
                on
                  ? "bg-sun text-paper"
                  : "bg-paper text-ink/70 hover:bg-sun-soft/50"
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
