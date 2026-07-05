import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { FORUM_BOARDS } from "@/lib/forum";

export const metadata = { title: "討論區" };

export default async function ForumHome() {
  const counts = await db.forumPost.groupBy({
    by: ["board"],
    _count: { _all: true },
  });
  const countOf = (v: "TUTOR" | "PARENT") =>
    counts.find((c) => c.board === v)?._count._all ?? 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-4xl font-extrabold text-ink">討論區</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-3 mb-8 text-sm font-bold text-ink/60">
        老師與家長都能在兩個看板發言、回覆,也可以選擇匿名。
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        {(Object.keys(FORUM_BOARDS) as Array<keyof typeof FORUM_BOARDS>).map(
          (slug) => {
            const b = FORUM_BOARDS[slug];
            return (
              <Link
                key={slug}
                href={`/forum/${slug}`}
                className={`flex min-h-44 items-stretch overflow-hidden rounded-2xl border border-line ${b.accent} text-paper transition hover:-translate-y-1 hover:shadow-card-hover`}
              >
                {/* 左：文字 */}
                <div className="flex flex-1 flex-col justify-center px-6 py-6">
                  <h2 className="font-serif text-2xl font-bold">{b.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-paper/85">
                    {b.desc}
                  </p>
                  <p className="mt-3 text-xs font-bold text-paper/70">
                    {countOf(b.value)} 則主題
                  </p>
                </div>
                {/* 右：完整圖片（固定相同高度，兩張一樣大） */}
                <div className="flex shrink-0 items-end justify-center">
                  <Image
                    src={b.image}
                    alt={b.title}
                    width={158}
                    height={144}
                    className="h-36 w-auto object-contain object-bottom"
                  />
                </div>
              </Link>
            );
          }
        )}
      </div>
    </div>
  );
}
