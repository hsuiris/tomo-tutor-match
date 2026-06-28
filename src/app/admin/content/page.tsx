import { db } from "@/lib/db";
import {
  deleteForumPost,
  deleteForumReply,
  deleteReview,
} from "@/app/admin/actions";

export const metadata = { title: "內容管理 · Tomo" };

const PER = 50;
const BOARD_LABEL: Record<string, string> = {
  TUTOR: "老師區",
  PARENT: "家長區",
};

function name(u: { name: string; displayName: string | null }) {
  return u.displayName ?? u.name;
}

function DeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button className="shrink-0 rounded-full border border-line px-3 py-1 text-xs font-bold text-blush hover:bg-blush/10">
        刪除
      </button>
    </form>
  );
}

export default async function AdminContentPage() {
  const [posts, replies, reviews] = await Promise.all([
    db.forumPost.findMany({
      orderBy: { createdAt: "desc" },
      take: PER,
      select: {
        id: true,
        board: true,
        title: true,
        anonymous: true,
        createdAt: true,
        author: { select: { name: true, displayName: true } },
        _count: { select: { replies: true } },
      },
    }),
    db.forumReply.findMany({
      orderBy: { createdAt: "desc" },
      take: PER,
      select: {
        id: true,
        body: true,
        anonymous: true,
        createdAt: true,
        author: { select: { name: true, displayName: true } },
        post: { select: { title: true } },
      },
    }),
    db.review.findMany({
      orderBy: { createdAt: "desc" },
      take: PER,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        author: { select: { name: true, displayName: true } },
        reviewee: { select: { name: true, displayName: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-extrabold text-ink">內容管理</h1>
        <div className="mt-2 h-1 w-14 bg-sun" />
      </div>

      <section>
        <h2 className="mb-3 font-bold text-ink">論壇文章（最新 {posts.length}）</h2>
        <ul className="space-y-2">
          {posts.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-ink">
                  <span className="mr-2 rounded bg-sun-soft/50 px-1.5 py-0.5 text-xs text-ink/60">
                    {BOARD_LABEL[p.board]}
                  </span>
                  {p.title}
                </div>
                <div className="text-xs text-ink/40">
                  {p.anonymous ? "匿名" : name(p.author)} ・ {p._count.replies} 則回覆 ・{" "}
                  {p.createdAt.toLocaleDateString("zh-TW")}
                </div>
              </div>
              <DeleteButton action={deleteForumPost.bind(null, p.id)} />
            </li>
          ))}
          {posts.length === 0 && <li className="text-sm text-ink/40">無</li>}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-bold text-ink">論壇回覆（最新 {replies.length}）</h2>
        <ul className="space-y-2">
          {replies.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-ink">{r.body}</div>
                <div className="text-xs text-ink/40">
                  {r.anonymous ? "匿名" : name(r.author)} ・ 於「{r.post.title}」 ・{" "}
                  {r.createdAt.toLocaleDateString("zh-TW")}
                </div>
              </div>
              <DeleteButton action={deleteForumReply.bind(null, r.id)} />
            </li>
          ))}
          {replies.length === 0 && <li className="text-sm text-ink/40">無</li>}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-bold text-ink">評價（最新 {reviews.length}）</h2>
        <ul className="space-y-2">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-ink">
                  <span className="mr-2 font-bold text-sun-dark">
                    {"★".repeat(r.rating)}
                  </span>
                  {r.comment ?? <span className="text-ink/40">（無留言）</span>}
                </div>
                <div className="text-xs text-ink/40">
                  {name(r.author)} → {name(r.reviewee)} ・{" "}
                  {r.createdAt.toLocaleDateString("zh-TW")}
                </div>
              </div>
              <DeleteButton action={deleteReview.bind(null, r.id)} />
            </li>
          ))}
          {reviews.length === 0 && <li className="text-sm text-ink/40">無</li>}
        </ul>
      </section>
    </div>
  );
}
