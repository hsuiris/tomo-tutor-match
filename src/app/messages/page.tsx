import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Avatar from "@/components/Avatar";
import { publicName } from "@/lib/user";

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink">訊息</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-1 mb-6 text-sm text-ink/60">與老師或學生的私訊對話</p>

      {conversations.length === 0 ? (
        <div className="mt-16 text-center text-ink/40">
          還沒有任何對話。到{" "}
          {session.user.role === "TUTOR" ? (
            <>
              <Link href="/jobs" className="text-cobalt hover:underline">
                找學生
              </Link>{" "}
              頁面私訊有興趣的學生吧。
            </>
          ) : (
            <>
              <Link href="/tutors" className="text-cobalt hover:underline">
                找老師
              </Link>{" "}
              頁面私訊有興趣的老師吧。
            </>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-ink/10 rounded-2xl border border-line bg-paper">
          {conversations.map((c) => {
            const other = c.userA.id === me ? c.userB : c.userA;
            const last = c.messages[0];
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
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-ink">
                        {publicName(other)}
                      </span>
                      {last && (
                        <span className="text-xs text-ink/40">
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
