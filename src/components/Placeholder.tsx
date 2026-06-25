import Link from "next/link";

// 尚未實作的頁面佔位（後續 Phase 會完成）
export default function Placeholder({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <h1 className="font-serif text-3xl font-extrabold text-ink">{title}</h1>
      <p className="mt-3 text-ink/60">
        這個頁面將在 {phase} 完成,敬請期待。
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-cobalt hover:underline"
      >
        ← 回首頁
      </Link>
    </div>
  );
}
