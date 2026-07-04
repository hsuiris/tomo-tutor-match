import Link from "next/link";
import { notFound } from "next/navigation";
import BackLink from "@/components/BackLink";
import { db } from "@/lib/db";
import { FORUM_BOARDS, isBoardSlug } from "@/lib/forum";
import { forumAuthor } from "@/lib/user";
import NewPostForm from "@/components/NewPostForm";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ board: string }>;
}) {
  const { board } = await params;
  if (!isBoardSlug(board)) notFound();
  const meta = FORUM_BOARDS[board];

  const posts = await db.forumPost.findMany({
    where: { board: meta.value },
    orderBy: { lastReplyAt: "desc" },
    include: {
      author: { select: { name: true, displayName: true, role: true } },
      _count: { select: { replies: true } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <BackLink href="/forum">所有看板</BackLink>
      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2.5 font-serif text-3xl font-extrabold text-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meta.image}
            alt={meta.title}
            className="h-11 w-auto object-contain"
          />
          {meta.title}
        </h1>
        <NewPostForm board={meta.value} />
      </div>

      {posts.length === 0 ? (
        <div className="mt-16 text-center text-ink/40">
          還沒有主題,成為第一個發言的人吧。
        </div>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-2xl border border-line bg-paper">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/forum/${board}/${p.id}`}
                className="block px-5 py-4 transition hover:bg-sun-soft/40"
              >
                <h3 className="font-medium text-ink">{p.title}</h3>
                <p className="mt-1 line-clamp-1 text-sm text-ink/60">
                  {p.body}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-ink/40">
                  <span>{forumAuthor(p.author, p.anonymous)}</span>
                  <span>・ {p._count.replies} 則回覆</span>
                  <span>・ {p.createdAt.toLocaleDateString("zh-TW")}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
