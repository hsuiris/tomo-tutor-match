import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import TutorCard from "@/components/TutorCard";
import JobCard from "@/components/JobCard";
import FavoriteExtras from "@/components/FavoriteExtras";

export const metadata = { title: "我的收藏" };

const APP_STATUS_TEXT: Record<string, string> = {
  PENDING: "應徵中",
  ACCEPTED: "已錄取",
  REJECTED: "未錄取",
};

export default async function FavoritesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [favorites, myApplications] = await Promise.all([
    db.favorite.findMany({
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
            regions: true,
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
    }),
    // 我（老師身分）應徵過的案件與狀態
    db.application.findMany({
      where: { tutor: { userId: session.user.id } },
      select: { jobId: true, status: true },
    }),
  ]);

  const appStatusByJob = new Map(myApplications.map((a) => [a.jobId, a.status]));

  const tutorFavs = favorites.filter((f) => f.tutorProfile);
  const jobFavs = favorites.filter((f) => f.job);
  const appliedFavs = jobFavs.filter((f) => appStatusByJob.has(f.job!.id));
  const notAppliedFavs = jobFavs.filter((f) => !appStatusByJob.has(f.job!.id));

  const empty = tutorFavs.length === 0 && jobFavs.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-4xl font-extrabold text-ink">我的收藏</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-3 text-sm font-bold text-ink/60">
        你收藏的老師與需求都在這裡；應徵過的案件會自動存入「已應徵」。
      </p>

      {empty ? (
        <div className="mt-16 rounded-xl border border-line bg-paper p-10 text-center">
          <p className="text-2xl">🤍</p>
          <p className="mt-2 font-bold text-ink/60">
            還沒有收藏。在老師卡或學生卡點愛心即可加入收藏。
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {tutorFavs.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl font-bold text-ink">
                收藏的老師（{tutorFavs.length}）
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {tutorFavs.map((f) => (
                  <div key={f.id}>
                    <TutorCard tutor={f.tutorProfile!} favorited />
                    <FavoriteExtras favoriteId={f.id} note={f.note} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {appliedFavs.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl font-bold text-ink">
                已應徵的案件（{appliedFavs.length}）
              </h2>
              <p className="mt-1 text-sm text-ink/50">
                你應徵過的案件會自動出現在這裡，點進案件可查看應徵討論。
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {appliedFavs.map((f) => (
                  <div key={f.id}>
                    {/* 狀態章獨立一行，避免和卡片右上的徵求中/愛心打架 */}
                    <div className="mb-1.5 flex justify-end">
                      <span className="rounded-full bg-cobalt px-2.5 py-0.5 text-xs font-bold text-paper">
                        {APP_STATUS_TEXT[appStatusByJob.get(f.job!.id) ?? ""] ??
                          "已應徵"}
                      </span>
                    </div>
                    <JobCard job={f.job!} favorited />
                    <FavoriteExtras favoriteId={f.id} note={f.note} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {notAppliedFavs.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl font-bold text-ink">
                未應徵的案件（{notAppliedFavs.length}）
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {notAppliedFavs.map((f) => (
                  <div key={f.id}>
                    <JobCard job={f.job!} favorited />
                    <FavoriteExtras favoriteId={f.id} note={f.note} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
