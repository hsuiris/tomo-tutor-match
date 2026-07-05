import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FORUM_BOARDS, isBoardSlug } from "@/lib/forum";
import { forumAuthor } from "@/lib/user";
import ReplyForm from "@/components/ReplyForm";
import ForumPostControls from "@/components/ForumPostControls";
import ForumReplyActions from "@/components/ForumReplyActions";

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

type ReplyWithAuthor = {
  id: string;
  body: string;
  anonymous: boolean;
  authorId: string;
  parentId: string | null;
  createdAt: Date;
  editedAt: Date | null;
  author: { name: string; displayName: string | null; role: "STUDENT" | "TUTOR" | "ADMIN" };
};

export default async function PostPage({
  params,
}: {
  params: Promise<{ board: string; postId: string }>;
}) {
  const { board, postId } = await params;
  if (!isBoardSlug(board)) notFound();
  const meta = FORUM_BOARDS[board];
  const session = await auth();
  const me = session?.user.id;

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

  // 巢狀（一層）：最上層留言 + 其子回覆
  const replies = post.replies as ReplyWithAuthor[];
  const tops = replies.filter((r) => !r.parentId);
  const childrenOf = new Map<string, ReplyWithAuthor[]>();
  for (const r of replies) {
    if (r.parentId) {
      const list = childrenOf.get(r.parentId) ?? [];
      list.push(r);
      childrenOf.set(r.parentId, list);
    }
  }

  const metaLine = (r: ReplyWithAuthor) => (
    <div className="text-xs text-ink/40">
      {forumAuthor(r.author, r.anonymous)} ・ {r.createdAt.toLocaleString("zh-TW")}
      {r.editedAt && <span className="ml-1">（已編輯）</span>}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* 主題 */}
      <div className="mt-3 rounded-2xl border border-line bg-paper p-6">
        <h1 className="font-serif text-2xl font-extrabold text-ink">{post.title}</h1>
        <div className="mt-1 text-xs text-ink/40">
          {forumAuthor(post.author, post.anonymous)} ・{" "}
          {post.createdAt.toLocaleString("zh-TW")}
          {post.editedAt && <span className="ml-1">（已編輯）</span>}
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
          {post.body}
        </p>
        {me === post.authorId && (
          <ForumPostControls postId={post.id} title={post.title} body={post.body} />
        )}
      </div>

      {/* 回覆 */}
      <h2 className="mb-3 mt-6 text-sm font-bold text-ink/60">
        {post.replies.length} 則回覆
      </h2>
      <ul className="space-y-3">
        {tops.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-paper p-4">
            {metaLine(r)}
            <ForumReplyActions
              postId={post.id}
              replyId={r.id}
              replyTargetId={r.id}
              body={r.body}
              mine={me === r.authorId}
              loggedIn={!!session}
            />

            {/* 子回覆 */}
            {(childrenOf.get(r.id) ?? []).length > 0 && (
              <ul className="mt-3 space-y-3 border-l-2 border-line/50 pl-4">
                {(childrenOf.get(r.id) ?? []).map((c) => (
                  <li key={c.id}>
                    {metaLine(c)}
                    <ForumReplyActions
                      postId={post.id}
                      replyId={c.id}
                      replyTargetId={r.id}
                      body={c.body}
                      mine={me === c.authorId}
                      loggedIn={!!session}
                    />
                  </li>
                ))}
              </ul>
            )}
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
