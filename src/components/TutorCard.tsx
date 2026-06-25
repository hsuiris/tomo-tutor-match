import Link from "next/link";
import Avatar from "./Avatar";
import RatingStars from "./RatingStars";
import TrustBadges from "./TrustBadges";
import FavoriteButton from "./FavoriteButton";
import { MODE_LABELS, type TeachingMode } from "@/lib/constants";
import { publicName } from "@/lib/user";

export type TutorCardData = {
  id: string;
  bio: string | null;
  subjects: string[];
  levels: string[];
  regions: string[];
  hourlyRate: number | null;
  mode: TeachingMode;
  university: string | null;
  eduLevel: string | null;
  ratingAvg: number;
  ratingCount: number;
  user: {
    name: string;
    displayName: string | null;
    avatarUrl: string | null;
    idVerified: boolean;
    bgCheckVerified: boolean;
    eduVerified: boolean;
  };
};

export default function TutorCard({
  tutor,
  favorited = false,
}: {
  tutor: TutorCardData;
  favorited?: boolean;
}) {
  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10">
        <FavoriteButton type="tutor" targetId={tutor.id} initial={favorited} />
      </div>
      <Link
        href={`/tutors/${tutor.id}`}
        className="flex flex-col rounded-xl border border-line bg-paper p-5 transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(60,55,45,0.10)]"
      >
        <div className="flex items-start gap-3 pr-8">
        <div className="shrink-0">
          <Avatar name={publicName(tutor.user)} url={tutor.user.avatarUrl} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-serif text-lg font-bold text-ink">
            {publicName(tutor.user)}
          </h3>
          <div className="mt-0.5">
            <RatingStars value={tutor.ratingAvg} count={tutor.ratingCount} />
          </div>
          <p className="mt-1 truncate text-sm text-ink/50">
            {MODE_LABELS[tutor.mode]}
          </p>
        </div>
        {tutor.hourlyRate != null && (
          <div className="shrink-0 text-right">
            <span className="text-xl font-extrabold tabular-nums text-ink">
              <span className="mr-0.5 text-sm font-bold text-ink/60">NT$</span>
              {tutor.hourlyRate}
            </span>
            <span className="block text-xs text-ink/50">/ 小時</span>
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

      {(tutor.eduLevel || tutor.university) && (
        <p className="mt-2 truncate text-sm font-bold text-ink/60">
          🎓 {[tutor.eduLevel, tutor.university].filter(Boolean).join("・")}
        </p>
      )}

      {tutor.bio && (
        <p className="mt-2 line-clamp-2 text-sm text-ink/70">{tutor.bio}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tutor.subjects.map((s) => (
          <span
            key={s}
            className="tag-pill rounded-full bg-[#e09a1e] px-2.5 py-0.5 text-sm font-bold text-paper"
          >
            {s}
          </span>
        ))}
        {tutor.levels.map((lv) => (
          <span
            key={lv}
            className="tag-pill rounded-full bg-[#d97a2a] px-2.5 py-0.5 text-sm font-bold text-paper"
          >
            {lv}
          </span>
        ))}
      </div>

      <div className="mt-2 text-sm text-ink/50">
        📍 {tutor.regions.join("、")}
      </div>
      </Link>
    </div>
  );
}
