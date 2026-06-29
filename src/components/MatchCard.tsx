import Link from "next/link";
import Avatar from "./Avatar";
import RatingStars from "./RatingStars";
import TrustBadges from "./TrustBadges";
import FavoriteButton from "./FavoriteButton";
import ContactButton from "./ContactButton";
import ScoreRing from "./ScoreRing";
import { MODE_LABELS } from "@/lib/constants";
import { publicName } from "@/lib/user";
import { matchTier, type ScoredTutor } from "@/lib/match";
import { amountRange } from "@/lib/format";

export default function MatchCard({
  result,
  rank,
  favorited = false,
}: {
  result: ScoredTutor;
  rank: number;
  favorited?: boolean;
}) {
  const { tutor, score, reasons } = result;
  const tier = matchTier(score);

  return (
    <div className="relative rounded-2xl border border-line bg-paper p-5 transition hover:shadow-[0_8px_24px_rgba(60,55,45,0.10)]">
      {/* 排名徽章 */}
      {rank <= 3 && (
        <span className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-sun text-sm font-extrabold text-ink">
          {rank}
        </span>
      )}
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton type="tutor" targetId={tutor.id} initial={favorited} />
      </div>

      <div className="flex items-start gap-4 pr-8">
        <ScoreRing score={score} tone={tier.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Avatar name={publicName(tutor.user)} url={tutor.user.avatarUrl} />
            <div className="min-w-0">
              <Link
                href={`/tutors/${tutor.id}`}
                className="block truncate font-serif text-lg font-bold text-ink hover:underline"
              >
                {publicName(tutor.user)}
              </Link>
              <RatingStars value={tutor.ratingAvg} count={tutor.ratingCount} />
            </div>
          </div>
        </div>
        {amountRange(tutor.hourlyRate, tutor.hourlyRateMax) && (
          <div className="text-right">
            <span className="text-xl font-extrabold tabular-nums text-ink">
              <span className="mr-0.5 text-sm font-bold text-ink/60">NT$</span>
              {amountRange(tutor.hourlyRate, tutor.hourlyRateMax)}
            </span>
            <span className="block text-xs text-ink/50">／ 小時</span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <TrustBadges
          idVerified={tutor.user.idVerified}
          bgCheckVerified={tutor.user.bgCheckVerified}
          eduVerified={tutor.user.eduVerified}
          size="sm"
        />
      </div>

      {/* 為什麼推薦 */}
      <div className="mt-3 rounded-xl border border-dashed border-line/20 bg-sun-soft/20 p-3">
        <p className="mb-1.5 text-xs font-extrabold text-ink/70">
          {tier.label}・為什麼推薦這位老師
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {reasons.map((r, i) => (
            <li
              key={i}
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                r.positive
                  ? "bg-mint/15 text-ink"
                  : "bg-blushbg text-ink/70"
              }`}
            >
              {r.positive ? "✓ " : "！ "}
              {r.label}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs text-ink/50">
        {[tutor.eduLevel, tutor.university].filter(Boolean).join("・")}
        {(tutor.eduLevel || tutor.university) && " ・ "}
        {MODE_LABELS[tutor.mode]}
      </p>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/tutors/${tutor.id}`}
          className="flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-center text-sm font-bold text-ink transition hover:bg-sun"
        >
          查看詳情
        </Link>
        <div className="flex-1">
          <ContactButton tutorUserId={tutor.user.id} label="洽談預約" />
        </div>
      </div>
    </div>
  );
}
