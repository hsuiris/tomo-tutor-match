import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { amountRange } from "@/lib/format";
import Avatar from "@/components/Avatar";
import RatingStars from "@/components/RatingStars";
import TrustBadges from "@/components/TrustBadges";
import ContactButton from "@/components/ContactButton";
import ReviewForm from "@/components/ReviewForm";
import { publicName } from "@/lib/user";
import { MODE_LABELS, GENDER_LABELS, type TeachingMode } from "@/lib/constants";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const me = session?.user.id;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      tutorProfile: true,
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true, displayName: true } } },
      },
    },
  });
  if (!user) notFound();

  const tp = user.tutorProfile;
  const isTutor = user.role === "TUTOR";
  const name = publicName(user);

  // 評分（老師用 profile 統計；其餘即時算）
  const ratingAvg = tp
    ? tp.ratingAvg
    : user.reviewsReceived.length
      ? user.reviewsReceived.reduce((s, r) => s + r.rating, 0) /
        user.reviewsReceived.length
      : 0;
  const ratingCount = tp ? tp.ratingCount : user.reviewsReceived.length;

  // 是否可評價：登入、非本人、曾媒合、且尚未評過
  let canReview = false;
  if (me && me !== id) {
    const matched = await db.application.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { tutor: { userId: me }, job: { studentId: id } },
          { tutor: { userId: id }, job: { studentId: me } },
        ],
      },
      select: { id: true },
    });
    const reviewed = await db.review.findUnique({
      where: { revieweeId_authorId: { revieweeId: id, authorId: me } },
      select: { id: true },
    });
    canReview = !!matched && !reviewed;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* 標頭 */}
      <div className="flex items-center gap-4 rounded-xl border border-line bg-paper p-5">
        <Avatar name={name} url={user.avatarUrl} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-xl font-extrabold text-ink">{name}</h1>
            {user.gender !== "UNDISCLOSED" && (
              <span className="text-xs font-bold text-ink/50">
                {GENDER_LABELS[user.gender]}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {(isTutor || ratingCount > 0) && (
              <RatingStars value={ratingAvg} count={ratingCount} />
            )}
            <TrustBadges
              idVerified={user.idVerified}
              bgCheckVerified={user.bgCheckVerified}
              eduVerified={user.eduVerified}
              size="xs"
            />
          </div>
        </div>
        {me && me !== id && (
          <div className="w-32 shrink-0">
            <ContactButton tutorUserId={user.id} label="私訊" />
          </div>
        )}
      </div>

      {/* 老師教學資訊：已公開所有人可見；未公開時僅本人可預覽 */}
      {tp && (tp.isPublished || me === user.id) && (
        <div className="mt-6 rounded-xl border border-line bg-paper p-6">
          {!tp.isPublished && me === user.id && (
            <p className="mb-3 rounded-lg bg-sun-soft/40 px-3 py-2 text-sm text-ink/70">
              預覽模式：此檔案尚未公開，只有你看得到。發佈後學生才能在「找家教」看到。
            </p>
          )}
          <h2 className="font-serif text-2xl font-extrabold text-ink">教學資訊</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tp.subjects.map((s) => (
              <span
                key={s}
                className="tag-pill rounded-full bg-[#e09a1e] px-3 py-1 text-sm font-bold text-paper"
              >
                {s}
              </span>
            ))}
            {tp.levels.map((lv) => (
              <span
                key={lv}
                className="tag-pill rounded-full bg-[#d97a2a] px-3 py-1 text-sm font-bold text-paper"
              >
                {lv}
              </span>
            ))}
          </div>

          {/* 履歷文字（依序：學歷、教學經驗、自我介紹） */}
          {(tp.eduLevel ||
            tp.university ||
            tp.education ||
            tp.experience ||
            tp.bio) && (
            <div className="mt-5 space-y-4 border-t border-line/10 pt-5">
              {(tp.eduLevel || tp.university) && (
                <Block
                  label="學歷"
                  value={[tp.eduLevel, tp.university]
                    .filter(Boolean)
                    .join("・")}
                />
              )}
              {tp.education && <Block label="科系／詳細學歷" value={tp.education} />}
              {tp.experience && <Block label="教學經驗" value={tp.experience} />}
              {tp.bio && <Block label="自我介紹" value={tp.bio} />}
            </div>
          )}

          {/* 授課方式、時薪、授課地區 */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line/10 pt-5 sm:grid-cols-3">
            <Fact label="授課方式" value={MODE_LABELS[tp.mode as TeachingMode]} />
            <Fact
              label="時薪"
              value={
                amountRange(tp.hourlyRate, tp.hourlyRateMax)
                  ? `NT$${amountRange(tp.hourlyRate, tp.hourlyRateMax)}`
                  : "面議"
              }
              suffix={tp.hourlyRate != null ? "/ 小時" : undefined}
            />
            <Fact label="授課地區" value={tp.regions.join("、")} />
          </div>
        </div>
      )}

      {/* 評價牆 */}
      <div className="mt-6 rounded-xl border border-line bg-paper p-6">
        <h2 className="mb-4 font-serif font-serif text-2xl font-extrabold text-ink">
          評價與留言（{ratingCount}）
        </h2>

        {canReview && (
          <div className="mb-5 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
            <ReviewForm revieweeId={user.id} revieweeName={name} />
          </div>
        )}

        {user.reviewsReceived.length === 0 ? (
          <p className="text-sm text-ink/40">
            還沒有評價。完成媒合後即可在此留下評價。
          </p>
        ) : (
          <ul className="space-y-4">
            {user.reviewsReceived.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-line/10 bg-paper p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">
                    {publicName(r.author)}
                  </span>
                  <span className="text-sm text-amber-400">
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </span>
                </div>
                {r.comment && (
                  <p className="mt-1.5 text-sm text-ink/70">{r.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// 履歷文字區塊（學歷／教學經驗／自我介紹）
function Block({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold tracking-wide text-ink/70">{label}</h3>
      <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-ink">
        {value}
      </p>
    </div>
  );
}

// 短欄位資訊格（授課方式／時薪／授課地區）
function Fact({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-line/15 bg-sun-soft/30 p-3">
      <div className="text-xs font-bold text-ink/70">{label}</div>
      <div className="mt-0.5 text-lg font-bold tabular-nums text-ink">
        {value}
        {suffix && (
          <span className="ml-1 text-xs font-bold text-ink/60">{suffix}</span>
        )}
      </div>
    </div>
  );
}
