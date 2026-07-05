import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { amountRange } from "@/lib/format";
import Avatar from "@/components/Avatar";
import RatingStars from "@/components/RatingStars";
import TrustBadges from "@/components/TrustBadges";
import ApplyForm from "@/components/ApplyForm";
import ApplicationControls from "@/components/ApplicationControls";
import ApplicationReplyForm from "@/components/ApplicationReplyForm";
import TutorCard, { type TutorCardData } from "@/components/TutorCard";
import { publicName } from "@/lib/user";
import { hasTutorProfile } from "@/lib/tutor";
import { acceptApplication, rejectApplication } from "@/app/jobs/actions";
import { MODE_LABELS, type TeachingMode } from "@/lib/constants";

const APP_STATUS: Record<string, { text: string; cls: string }> = {
  PENDING: { text: "應徵中", cls: "bg-amber-50 text-amber-600" },
  ACCEPTED: { text: "已錄取", cls: "bg-emerald-50 text-emerald-600" },
  REJECTED: { text: "未錄取", cls: "bg-sun-soft/50 text-ink/40" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await db.jobPost.findUnique({
    where: { id },
    select: { title: true, subject: true, regions: true, description: true },
  });
  if (!job) return { title: "找不到案件" };
  return {
    title: job.title,
    description:
      job.description?.slice(0, 120) ||
      `${job.regions.join("、")}・${job.subject} 家教需求，歡迎老師應徵。`,
    alternates: { canonical: `/jobs/${id}` },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const job = await db.jobPost.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, displayName: true } },
      applications: {
        orderBy: { createdAt: "asc" },
        include: {
          tutor: {
            select: {
              id: true,
              userId: true,
              hourlyRate: true,
              hourlyRateMax: true,
              subjects: true,
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
          replies: {
            orderBy: { createdAt: "asc" },
            include: {
              author: { select: { id: true, name: true, displayName: true } },
            },
          },
        },
      },
    },
  });

  if (!job) notFound();

  const isOwner = session?.user.id === job.student.id;
  // 能不能應徵看「有沒有老師檔案」，不看 JWT role
  const isTutor = session ? await hasTutorProfile(session.user.id) : false;
  const myApplication = isTutor
    ? job.applications.find((a) => a.tutor.userId === session?.user.id)
    : undefined;

  // 系統依家長需求（科目／學制／地區／預算）推薦適合的老師,並以信任度+評價排序
  const appliedTutorIds = new Set(job.applications.map((a) => a.tutor.id));
  // 推薦給案主（即使案主本身也是老師，找老師時一樣需要）
  let recommended: TutorCardData[] = [];
  if (isOwner && job.status === "OPEN") {
    const matches = await db.tutorProfile.findMany({
      where: {
        isPublished: true,
        userId: { not: job.student.id },
        subjects: { has: job.subject },
        ...(job.level ? { levels: { has: job.level } } : {}),
        regions: { hasSome: [...job.regions, "線上"] },
        ...(job.budget != null
          ? { OR: [{ hourlyRate: { lte: job.budget } }, { hourlyRate: null }] }
          : {}),
      },
      orderBy: [
        { user: { idVerified: "desc" } },
        { user: { bgCheckVerified: "desc" } },
        { user: { eduVerified: "desc" } },
        { ratingAvg: "desc" },
        { ratingCount: "desc" },
      ],
      take: 8,
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
    });
    // 已應徵此案的老師排在後面（仍顯示,但優先看新人選）
    recommended = matches
      .sort(
        (a, b) =>
          Number(appliedTutorIds.has(a.id)) - Number(appliedTutorIds.has(b.id))
      )
      .slice(0, 4);
  }


  return (
    <div className="mx-auto max-w-3xl px-4 py-10">

      {/* 案件資訊 */}
      <div className="mt-4 rounded-2xl border border-line bg-paper p-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-serif text-3xl font-extrabold text-ink">{job.title}</h1>
          <div className="flex shrink-0 items-center gap-2">
            {/* 自己發布的需求：編輯而非應徵 */}
            {isOwner && job.status === "OPEN" && (
              <Link
                href={`/jobs/${job.id}/edit`}
                className="rounded-full border border-line bg-paper px-4 py-1.5 text-sm font-bold text-ink/70 hover:bg-sun-soft/50"
              >
                ✏️ 編輯需求
              </Link>
            )}
            {job.status === "MATCHED" && (
              <span className="rounded-full bg-sun-soft/50 px-3 py-1 text-sm text-ink/60">
                已配對
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-sun-soft px-2.5 py-0.5 font-medium text-cobalt">
            {job.subject}
          </span>
          {job.level && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-medium text-amber-700">
              {job.level}
            </span>
          )}
          <span className="text-ink/60">📍 {job.regions.join("、")}</span>
          <span className="text-ink/60">
            ・ {MODE_LABELS[job.mode as TeachingMode]}
          </span>
          {amountRange(job.budget, job.budgetMax) && (
            <span className="font-bold text-cobalt">
              ${amountRange(job.budget, job.budgetMax)} / 小時
            </span>
          )}
        </div>

        {(job.studentStatus || job.parentNeeds) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {job.studentStatus && (
              <div className="rounded-2xl border border-line/15 bg-sun-soft/30 p-4">
                <div className="text-xs font-bold text-ink/50">學生狀況</div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                  {job.studentStatus}
                </p>
              </div>
            )}
            {job.parentNeeds && (
              <div className="rounded-2xl border border-line/15 bg-blushbg/40 p-4">
                <div className="text-xs font-bold text-ink/50">家長訴求</div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">
                  {job.parentNeeds}
                </p>
              </div>
            )}
          </div>
        )}

        {job.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-ink/70">
            {job.description}
          </p>
        )}

        <p className="mt-4 text-xs text-ink/40">
          由{" "}
          <Link
            href={`/u/${job.student.id}`}
            className="text-cobalt hover:underline"
          >
            {publicName(job.student)}
          </Link>{" "}
          發布 ・ {job.createdAt.toLocaleDateString("zh-TW")}
        </p>
      </div>

      {/* 系統推薦：依案主需求媒合適合的老師（案主本人可見） */}
      {isOwner && job.status === "OPEN" && (
        <div className="mt-6 rounded-2xl border border-line bg-paper p-6">
          <h2 className="font-serif text-xl font-extrabold text-ink">
            ✨ 為你推薦的老師
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            根據你的需求（{job.subject}
            {job.level ? `・${job.level}` : ""}・{job.regions.join("、")}
            {amountRange(job.budget, job.budgetMax)
              ? `・預算 $${amountRange(job.budget, job.budgetMax)}`
              : ""}）為你篩選,
            並優先推薦通過實名、無犯罪紀錄與學歷認證的老師。
          </p>
          {recommended.length === 0 ? (
            <p className="mt-4 text-sm text-ink/40">
              目前沒有完全符合條件的老師,試著放寬預算或地區,或等老師主動應徵。
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {recommended.map((t) => (
                <TutorCard key={t.id} tutor={t} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 老師視角：應徵 */}
      {isTutor && !isOwner && (
        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-bold text-ink">應徵這個案件</h2>
          {myApplication ? (
            <div className="rounded-lg bg-sun-soft/30 px-4 py-3 text-sm text-ink/70">
              已送出應徵,狀態：
              <span className="font-medium">
                {APP_STATUS[myApplication.status].text}
              </span>
              。此案件已自動存入
              <Link href="/favorites" className="mx-0.5 font-medium text-cobalt hover:underline">
                收藏的「已應徵」
              </Link>
              ;應徵訊息與討論在下方「應徵討論」區。
            </div>
          ) : job.status !== "OPEN" ? (
            <p className="text-sm text-ink/40">這個案件已不再開放應徵。</p>
          ) : (
            <ApplyForm jobId={job.id} />
          )}
        </div>
      )}

      {/* 應徵討論：案主與已應徵的老師可見（像討論區，家長可回覆） */}
      {(isOwner || myApplication) && (
        <div className="mt-6 rounded-2xl border border-line bg-paper p-6">
          <h2 className="mb-1 font-bold text-ink">
            應徵討論（{job.applications.length}）
          </h2>
          <p className="mb-4 text-xs text-ink/40">
            {isOwner
              ? "老師的應徵訊息都在這裡，可以直接回覆詢問細節。"
              : "應徵後可以看到其他老師的應徵與案主的回覆；案主可在你的應徵下回覆你。"}
          </p>
          {job.applications.length === 0 ? (
            <p className="text-sm text-ink/40">還沒有老師應徵,再等等看。</p>
          ) : (
            <ul className="space-y-4">
              {job.applications.map((app) => {
                const st = APP_STATUS[app.status];
                const isMine = app.tutor.userId === session?.user.id;
                return (
                  <li
                    key={app.id}
                    className={`rounded-xl border p-4 ${
                      isMine ? "border-sun/50 bg-sun-soft/20" : "border-line/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={publicName(app.tutor.user)}
                        url={app.tutor.user.avatarUrl}
                        size={44}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/tutors/${app.tutor.id}`}
                            className="font-medium text-ink hover:text-cobalt"
                          >
                            {publicName(app.tutor.user)}
                          </Link>
                          {isMine && (
                            <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-bold text-paper">
                              我的應徵
                            </span>
                          )}
                          <TrustBadges
                            idVerified={app.tutor.user.idVerified}
                            bgCheckVerified={app.tutor.user.bgCheckVerified}
                            size="xs"
                          />
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${st.cls}`}
                          >
                            {st.text}
                          </span>
                        </div>
                        <div className="mt-0.5">
                          <RatingStars
                            value={app.tutor.ratingAvg}
                            count={app.tutor.ratingCount}
                          />
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-ink/70">
                          {app.message}
                        </p>

                        {/* 討論串（案主與該老師的往來） */}
                        {app.replies.length > 0 && (
                          <ul className="mt-3 space-y-2 border-l-2 border-line/40 pl-3">
                            {app.replies.map((r) => (
                              <li key={r.id} className="text-sm">
                                <span className="font-medium text-ink">
                                  {publicName(r.author)}
                                </span>
                                <span className="ml-1.5 rounded-full bg-sun-soft/60 px-1.5 py-0.5 text-[10px] font-medium text-ink/50">
                                  {r.author.id === job.student.id ? "案主" : "老師"}
                                </span>
                                <span className="ml-2 text-xs text-ink/40">
                                  {r.createdAt.toLocaleString("zh-TW")}
                                </span>
                                <p className="mt-0.5 whitespace-pre-wrap text-ink/70">
                                  {r.body}
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* 回覆框：案主可回覆任何應徵；老師只能回覆自己的 */}
                        {(isOwner || isMine) && (
                          <ApplicationReplyForm applicationId={app.id} />
                        )}

                        {/* 自己的應徵：編輯／取消（尚未有結果時） */}
                        {isMine &&
                          job.status === "OPEN" &&
                          app.status === "PENDING" && (
                            <ApplicationControls
                              applicationId={app.id}
                              message={app.message}
                            />
                          )}

                        {/* 案主操作：只有案件還開放時 */}
                        {isOwner &&
                          job.status === "OPEN" &&
                          app.status === "PENDING" && (
                          <div className="mt-3 flex gap-2">
                            <form action={acceptApplication.bind(null, app.id)}>
                              <button className="rounded-full bg-sun px-4 py-2.5 text-sm font-bold text-paper hover:bg-sun/80">
                                接受並配對
                              </button>
                            </form>
                            <form action={rejectApplication.bind(null, app.id)}>
                              <button className="rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink/70 hover:bg-sun-soft/40">
                                婉拒
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* 未登入 / 學生非案主 */}
      {!session && (
        <div className="mt-6 rounded-2xl border border-line bg-paper p-6 text-center text-sm text-ink/60">
          想應徵這個案件嗎?請先{" "}
          <Link href="/login" className="font-medium text-cobalt hover:underline">
            登入
          </Link>{" "}
          老師帳號。
        </div>
      )}
    </div>
  );
}
