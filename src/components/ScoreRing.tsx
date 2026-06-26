// 契合度圓環（純 SVG，無外部依賴）。智能匹配與智能接案共用。
const RING_TONE: Record<string, string> = {
  high: "text-mint",
  mid: "text-cobalt",
  low: "text-ink/40",
};

export default function ScoreRing({
  score,
  tone,
}: {
  score: number;
  tone: "high" | "mid" | "low";
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90">
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke="#1a1a1a"
          strokeOpacity="0.1"
          strokeWidth="6"
        />
        <circle
          cx="34"
          cy="34"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={RING_TONE[tone]}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold leading-none tabular-nums text-ink">
          {score}
        </span>
        <span className="text-[9px] font-bold text-ink/50">契合度</span>
      </div>
    </div>
  );
}
