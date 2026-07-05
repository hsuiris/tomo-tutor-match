import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasTutorProfile } from "@/lib/tutor";
import { MODE_LABELS, type TeachingMode } from "@/lib/constants";

const APP_STATUS: Record<string, { text: string; cls: string }> = {
  PENDING: { text: "應徵中", cls: "bg-amber-50 text-amber-600" },
  ACCEPTED: { text: "已錄取 🎉", cls: "bg-emerald-50 text-emerald-600" },
  REJECTED: { text: "未錄取", cls: "bg-sun-soft/50 text-ink/40" },
};

export default async function MyApplicationsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!(await hasTutorProfile(session.user.id))) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-ink/60">
        還不是老師，沒有應徵紀錄。先到面板「成為老師」吧。
      </div>
    );
  }

  const applications = await db.application.findMany({
    where: { tutor: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          subject: true,
          regions: true,
          mode: true,
          budget: true,
          budgetMax: true,
          status: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink">我的應徵</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-1 mb-6 text-sm text-ink/60">
        共 {applications.length} 筆應徵紀錄
      </p>

      {applications.length === 0 ? (
        <div className="mt-16 text-center text-ink/40">
          你還沒有應徵任何案件,去{" "}
          <Link href="/jobs" className="text-cobalt hover:underline">
            家教需求
          </Link>{" "}
          看看吧。
        </div>
      ) : (
        <ul className="space-y-3">
          {applications.map((app) => {
            const st = APP_STATUS[app.status];
            return (
              <li key={app.id}>
                <Link
                  href={`/jobs/${app.job.id}`}
                  className="block rounded-2xl border border-line p-5 transition hover:border-line hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-ink">
                      {app.job.title}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}
                    >
                      {st.text}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink/40">
                    <span className="rounded-full bg-sun-soft px-2 py-0.5 font-medium text-cobalt">
                      {app.job.subject}
                    </span>
                    <span>📍 {app.job.regions.join("、")}</span>
                    <span>・ {MODE_LABELS[app.job.mode as TeachingMode]}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-ink/60">
                    我的應徵訊息：{app.message}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
