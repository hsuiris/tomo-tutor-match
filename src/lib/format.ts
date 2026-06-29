// 金額區間文字（不含 NT$／單位）；兩邊皆空回 null（呼叫端自行決定 fallback，如「面議」）
// 兩邊都填：500–800（相等則 500）；只填下限：500 起；只填上限：800 以內
export function amountRange(
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return max > min ? `${min}–${max}` : `${min}`;
  if (min != null) return `${min} 起`;
  return `${max} 以內`;
}
