import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Avatar from "@/components/Avatar";
import { publicName } from "@/lib/user";
import { teachingRelations, relationLabel } from "@/lib/relationship";
import { markNotificationsRead } from "@/app/messages/actions";

export default async function MessagesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const me = session.user.id;

  const conversations = await db.conversation.findMany({
    where: { OR: [{ userAId: me }, { userBId: me }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      userA: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
      userB: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  // 一次查出我的所有已媒合關係，給每段對話標對方身分
  const { myTutorIds, myStudentIds } = await teachingRelations(me);

  // 系統通知（審核結果等）
  const notifications = await db.notification.findMany({
    where: { userId: me },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink">訊息</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-1 mb-6 text-sm text-ink/60">系統通知與私訊對話</p>

      {/* 系統通知（審核結果等） */}
      {notifications.length > 0 && (
        <section className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-ink">
              系統通知
              {unread > 0 && (
                <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-bold text-paper">
                  {unread}
                </span>
              )}
            </h2>
            {unread > 0 && (
              <form action={markNotificationsRead}>
                <button className="text-xs font-bold text-cobalt hover:underline">
                  全部標為已讀
                </button>
              </form>
            )}
          </div>
          <ul className="divide-y divide-ink/10 rounded-2xl border border-line bg-paper">
            {notifications.map((n) => {
              const inner = (
                <div className={`p-4 ${n.read ? "" : "bg-sun-soft/40"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      {!n.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-sun" />
                      )}
                      <span className="truncate font-medium text-ink">
                        {n.title}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-ink/40">
                      {n.createdAt.toLocaleDateString("zh-TW")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink/60">{n.body}</p>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link
                      href={n.href}
                      className="block transition hover:bg-sun-soft/30"
                    >
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* 私訊 */}
      <h2 className="mb-2 font-bold text-ink">私訊</h2>
      {conversations.length === 0 ? (
        <div className="mt-16 text-center text-ink/40">
          還沒有任何對話。到{" "}
          <Link href="/tutors" className="text-cobalt hover:underline">
            找老師
          </Link>{" "}
          或{" "}
          <Link href="/jobs" className="text-cobalt hover:underline">
            找學生
          </Link>{" "}
          頁面私訊吧。
        </div>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-2xl border border-line bg-paper">
          {conversations.map((c) => {
            const other = c.userA.id === me ? c.userB : c.userA;
            const last = c.messages[0];
            const hat = relationLabel(
              myTutorIds.has(other.id),
              myStudentIds.has(other.id)
            );
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="flex items-center gap-3 p-4 transition hover:bg-sun-soft/40"
                >
                  <Avatar
                    name={publicName(other)}
                    url={other.avatarUrl}
                    size={48}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate font-medium text-ink">
                          {publicName(other)}
                        </span>
                        {hat && (
                          <span className="shrink-0 rounded-full bg-sun-soft/60 px-1.5 py-0.5 text-[10px] font-medium text-ink/60">
                            {hat}
                          </span>
                        )}
                      </span>
                      {last && (
                        <span className="shrink-0 text-xs text-ink/40">
                          {last.createdAt.toLocaleDateString("zh-TW")}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-ink/60">
                      {last
                        ? `${last.senderId === me ? "你：" : ""}${last.body}`
                        : "開始你們的對話"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
