import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Avatar from "@/components/Avatar";
import MessageComposer from "@/components/MessageComposer";
import ChatPoller from "@/components/ChatPoller";
import { publicName } from "@/lib/user";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");
  const me = session.user.id;

  const convo = await db.conversation.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
      userB: { select: { id: true, name: true, displayName: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!convo || (convo.userAId !== me && convo.userBId !== me)) notFound();

  const other = convo.userA.id === me ? convo.userB : convo.userA;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 py-4">
      <ChatPoller />

      {/* 標頭 */}
      <div className="flex items-center gap-3 border-b border-line/15 pb-3">
        <Link href="/messages" className="text-ink/40 hover:text-cobalt">
          ←
        </Link>
        <Avatar name={publicName(other)} url={other.avatarUrl} size={40} />
        <span className="font-bold text-ink">
          {publicName(other)}
        </span>
      </div>

      {/* 訊息區 */}
      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {convo.messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink/40">
            還沒有訊息,打聲招呼吧 👋
          </p>
        ) : (
          convo.messages.map((m) => {
            const mine = m.senderId === me;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "bg-sun text-paper"
                      : "bg-sun-soft/50 text-ink"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${
                      mine ? "text-paper/60" : "text-ink/40"
                    }`}
                  >
                    {m.createdAt.toLocaleTimeString("zh-TW", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 輸入框 */}
      <div className="-mx-4">
        <MessageComposer conversationId={convo.id} />
      </div>
    </div>
  );
}
