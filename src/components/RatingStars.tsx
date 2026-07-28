// 以實心/空心星星顯示評分（四捨五入到 0.5）
export default function RatingStars({
  value,
  count,
}: {
  value: number;
  count?: number;
}) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="inline-flex text-amber-400" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => {
          if (rounded >= i) return <span key={i}>★</span>;
          // 半星：空心星上疊左半顆實心星（半星字元 ⯨ 多數字型不支援）
          if (rounded >= i - 0.5)
            return (
              <span key={i} className="relative">
                ☆
                <span className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                  ★
                </span>
              </span>
            );
          return <span key={i}>☆</span>;
        })}
      </span>
      <span className="font-medium text-ink/80">
        {value > 0 ? value.toFixed(1) : "—"}
      </span>
      {count !== undefined && (
        <span className="text-ink/40">({count})</span>
      )}
    </span>
  );
}
