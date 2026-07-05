import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FORUM_BOARDS, isBoardSlug } from "@/lib/forum";
import { forumAuthor } from "@/lib/user";
import ReplyForm from "@/components/ReplyForm";
import BackLink from "@/components/BackLink";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ board: string; postId: string }>;
}) {
  const { board, postId } = await params;
  if (!isBoardSlug(board)) return { title: "討論區" };
  const post = await db.forumPost.findUnique({
    where: { id: postId },
    select: { title: true, body: true },
  });
  if (!post) return { title: "找不到主題" };
  return {
    title: post.title,
    description: post.body.slice(0, 120),
    alternates: { canonical: `/forum/${board}/${postId}` },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ board: string; postId: string }>;
}) {
  const { board, postId } = await params;
  if (!isBoardSlug(board)) notFound();
  const meta = FORUM_BOARDS[board];
  const session = await auth();

  const post = await db.forumPost.findUnique({
    where: { id: postId },
    include: {
      author: { select: { name: true, displayName: true, role: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { name: true, displayName: true, role: true } },
        },
      },
    },
  });
  if (!post || post.board !== meta.value) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <BackLink href={`/forum/${board}`}>{meta.title}</BackLink>

      {/* 主題 */}
      <div className="mt-3 rounded-2xl border border-line bg-paper p-6">
        <h1 className="font-serif text-2xl font-extrabold text-ink">{post.title}</h1>
        <div className="mt-1 text-xs text-ink/40">
          {forumAuthor(post.author, post.anonymous)} ・{" "}
          {post.createdAt.toLocaleString("zh-TW")}
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
          {post.body}
        </p>
      </div>

      {/* 回覆 */}
      <h2 className="mb-3 mt-6 text-sm font-bold text-ink/60">
        {post.replies.length} 則回覆
      </h2>
      <ul className="space-y-3">
        {post.replies.map((r) => (
          <li
            key={r.id}
            className="rounded-2xl border border-line bg-paper p-4"
          >
            <div className="text-xs text-ink/40">
              {forumAuthor(r.author, r.anonymous)} ・{" "}
              {r.createdAt.toLocaleString("zh-TW")}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">
              {r.body}
            </p>
          </li>
        ))}
      </ul>

      {/* 回覆表單 */}
      <div className="mt-6">
        {session ? (
          <ReplyForm postId={post.id} />
        ) : (
          <p className="rounded-2xl border border-line bg-sun-soft/30 p-4 text-center text-sm text-ink/60">
            請先{" "}
            <Link href="/login" className="text-cobalt hover:underline">
              登入
            </Link>{" "}
            後回覆。
          </p>
        )}
      </div>
    </div>
  );
}
