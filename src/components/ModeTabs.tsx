import Link from "next/link";

// 找老師／找學生頁共用：切換「篩選瀏覽」與「智能配對」兩種模式
export default function ModeTabs({
  base,
  active,
  browseLabel,
  matchLabel,
}: {
  base: string;
  active: "browse" | "match";
  browseLabel: string;
  matchLabel: string;
}) {
  const tab = "rounded-full px-5 py-2 text-sm font-bold transition";
  const on = "bg-sun text-paper";
  const off = "text-ink/60 hover:text-ink";
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-paper p-1">
      <Link href={base} className={`${tab} ${active === "browse" ? on : off}`}>
        {browseLabel}
      </Link>
      <Link
        href={`${base}?view=match`}
        className={`${tab} ${active === "match" ? on : off}`}
      >
        {matchLabel}
      </Link>
    </div>
  );
}
