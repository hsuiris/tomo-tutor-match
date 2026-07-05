import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import Avatar from "@/components/Avatar";
import RatingStars from "@/components/RatingStars";
import TrustBadges from "@/components/TrustBadges";
import { publicName } from "@/lib/user";

export const metadata = { title: "過去的老師" };

// 家長端：成交過的老師紀錄（可回頭評價、保留合作紀錄）
export default async function PastTutorsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const matches = await db.application.findMany({
    where: { status: "ACCEPTED", job: { studentId: session.user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      job: { select: { id: true, title: true, subject: true } },
      tutor: {
        select: {
          userId: true,
          ratingAvg: true,
          ratingCount: true,
          user: {
            select: {
              name: true,
              displayName: true,
              avatarUrl: true,
              idVerified: true,
              bgCheckVerified: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink">過去的老師</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-1 mb-6 text-sm text-ink/60">
        成交過的老師都在這裡，方便回頭評價與保持紀錄。
      </p>

      {matches.length === 0 ? (
        <div className="mt-16 text-center text-ink/40">
          還沒有成交紀錄。發布需求並接受老師的應徵後，會出現在這裡。
        </div>
      ) : (
        <ul className="space-y-3">
          {matches.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5"
            >
              <Avatar
                name={publicName(m.tutor.user)}
                url={m.tutor.user.avatarUrl}
                size={48}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/u/${m.tutor.userId}`}
                    className="font-bold text-ink hover:text-cobalt"
                  >
                    {publicName(m.tutor.user)}
                  </Link>
                  <TrustBadges
                    idVerified={m.tutor.user.idVerified}
                    bgCheckVerified={m.tutor.user.bgCheckVerified}
                    size="xs"
                  />
                </div>
                <div className="mt-0.5">
                  <RatingStars
                    value={m.tutor.ratingAvg}
                    count={m.tutor.ratingCount}
                  />
                </div>
                <p className="mt-1 truncate text-sm text-ink/50">
                  {m.job.subject}・
                  <Link
                    href={`/jobs/${m.job.id}`}
                    className="hover:underline"
                  >
                    {m.job.title}
                  </Link>
                  ・{m.createdAt.toLocaleDateString("zh-TW")} 成交
                </p>
              </div>
              <Link
                href={`/u/${m.tutor.userId}`}
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
