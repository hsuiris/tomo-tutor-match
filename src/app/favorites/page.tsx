import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import TutorCard from "@/components/TutorCard";
import JobCard from "@/components/JobCard";

export const metadata = { title: "我的收藏" };

export default async function FavoritesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const favorites = await db.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      tutorProfile: {
        select: {
          id: true,
          bio: true,
          subjects: true,
          levels: true,
          regions: true,
          hourlyRate: true,
          hourlyRateMax: true,
          mode: true,
          university: true,
          eduLevel: true,
          ratingAvg: true,
          ratingCount: true,
          user: {
            select: {
              name: true,
              displayName: true,
              avatarUrl: true,
              idVerified: true,
              bgCheckVerified: true,
              eduVerified: true,
            },
          },
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          subject: true,
          level: true,
          region: true,
          mode: true,
          budget: true,
          budgetMax: true,
          status: true,
          studentStatus: true,
          parentNeeds: true,
          createdAt: true,
          student: { select: { name: true } },
          _count: { select: { applications: true } },
        },
      },
    },
  });

  const tutors = favorites.flatMap((f) => (f.tutorProfile ? [f.tutorProfile] : []));
  const jobs = favorites.flatMap((f) => (f.job ? [f.job] : []));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-4xl font-extrabold text-ink">我的收藏</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-3 text-sm font-bold text-ink/60">
        你收藏的老師與需求都在這裡,方便之後回來比較。
      </p>

      {tutors.length === 0 && jobs.length === 0 ? (
        <div className="mt-16 rounded-xl border border-line bg-paper p-10 text-center">
          <p className="text-2xl">🤍</p>
          <p className="mt-2 font-bold text-ink/60">
            還沒有收藏。在老師卡或學生卡點愛心即可加入收藏。
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {tutors.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl font-bold text-ink">
                收藏的老師（{tutors.length}）
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {tutors.map((t) => (
                  <TutorCard key={t.id} tutor={t} favorited />
                ))}
              </div>
            </section>
          )}

          {jobs.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl font-bold text-ink">
                收藏的學生需求（{jobs.length}）
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {jobs.map((j) => (
                  <JobCard key={j.id} job={j} favorited />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
