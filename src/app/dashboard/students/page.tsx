import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Avatar from "@/components/Avatar";
import { publicName } from "@/lib/user";

export const metadata = { title: "我的學生" };

// 老師端：成交過的學生／家長紀錄（可回頭評價、保持聯繫）
export default async function PastStudentsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const matches = await db.application.findMany({
    where: { status: "ACCEPTED", tutor: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          subject: true,
          student: {
            select: { id: true, name: true, displayName: true, avatarUrl: true },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink">我的學生</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-1 mb-6 text-sm text-ink/60">
        成交過的學生與家長都在這裡，方便回頭評價與保持紀錄。
      </p>

      {matches.length === 0 ? (
        <div className="mt-16 text-center text-ink/40">
          還沒有成交紀錄。應徵案件並被案主接受後，會出現在這裡。
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5"
            >
              <Avatar
                name={publicName(m.job.student)}
                url={m.job.student.avatarUrl}
                size={48}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/u/${m.job.student.id}`}
                  className="font-bold text-ink hover:text-cobalt"
                >
                  {publicName(m.job.student)}
                </Link>
                <p className="mt-1 truncate text-sm text-ink/50">
                  {m.job.subject}・
                  <Link href={`/jobs/${m.job.id}`} className="hover:underline">
                    {m.job.title}
                  </Link>
                  ・{m.createdAt.toLocaleDateString("zh-TW")} 成交
                </p>
              </div>
              <Link
                href={`/u/${m.job.student.id}`}
                className="shrink-0 rounded-full bg-sun px-4 py-2 text-sm font-bold text-paper hover:bg-sun-dark"
              >
                查看並評價
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
