import Link from "next/link";
import FavoriteButton from "./FavoriteButton";
import ScoreRing from "./ScoreRing";
import { MODE_LABELS } from "@/lib/constants";
import { matchTier, type ScoredJob } from "@/lib/match";

export default function JobMatchCard({
  result,
  rank,
  favorited = false,
  applied = false,
}: {
  result: ScoredJob;
  rank: number;
  favorited?: boolean;
  applied?: boolean;
}) {
  const { job, score, reasons } = result;
  const tier = matchTier(score);

  return (
    <div className="relative rounded-2xl border border-line bg-paper p-5 transition hover:shadow-[0_8px_24px_rgba(60,55,45,0.10)]">
      {rank <= 3 && (
        <span className="absolute -left-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-sun text-sm font-extrabold text-ink">
          {rank}
        </span>
      )}
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton type="job" targetId={job.id} initial={favorited} />
      </div>

      <div className="flex items-start gap-4 pr-8">
        <ScoreRing score={score} tone={tier.tone} />
        <div className="min-w-0 flex-1">
          <Link
            href={`/jobs/${job.id}`}
            className="block font-serif text-lg font-bold text-ink hover:underline"
          >
            {job.title}
          </Link>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            {applied && (
              <span className="rounded-full border border-line bg-mint px-2.5 py-0.5 font-bold text-ink">
                ✓ 已應徵
              </span>
            )}
            <span className="tag-pill rounded-full bg-sun-soft px-2.5 py-0.5 font-bold text-ink">
              {job.subject}
            </span>
            {job.level && (
              <span className="tag-pill rounded-full bg-blushbg px-2.5 py-0.5 font-bold text-ink">
                {job.level}
              </span>
            )}
            <span className="text-ink/50">📍 {job.region}</span>
            <span className="text-ink/50">・ {MODE_LABELS[job.mode]}</span>
          </div>
        </div>
      </div>

      {/* 為什麼適合你接 */}
      <div className="mt-3 rounded-xl border border-dashed border-line/20 bg-sun-soft/20 p-3">
        <p className="mb-1.5 text-xs font-extrabold text-ink/70">
          {tier.label}・為什麼適合你接
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {reasons.map((r, i) => (
            <li
              key={i}
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                r.positive ? "bg-mint/15 text-ink" : "bg-blushbg text-ink/70"
              }`}
            >
              {r.positive ? "✓ " : "！ "}
              {r.label}
            </li>
          ))}
        </ul>
      </div>

      {(job.studentStatus || job.parentNeeds) && (
        <dl className="mt-3 space-y-1.5 text-xs">
          {job.studentStatus && (
            <div>
              <dt className="font-bold text-ink/50">學生狀況</dt>
              <dd className="line-clamp-2 text-ink/80">{job.studentStatus}</dd>
            </div>
          )}
          {job.parentNeeds && (
            <div>
              <dt className="font-bold text-ink/50">家長訴求</dt>
              <dd className="line-clamp-2 text-ink/80">{job.parentNeeds}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <span>
          {job.budget != null ? (
            <span className="text-lg font-extrabold tabular-nums text-ink">
              <span className="mr-0.5 text-xs font-bold text-ink/60">NT$</span>
              {job.budget}
              <span className="ml-0.5 text-xs font-normal text-ink/50">／ 小時</span>
            </span>
          ) : (
            <span className="text-sm text-ink/50">預算面議</span>
          )}
        </span>
        <Link
          href={`/jobs/${job.id}`}
          className={`rounded-full border border-line px-5 py-2 text-sm font-bold transition ${
            applied
              ? "bg-paper text-ink hover:bg-sun"
              : "bg-sun text-paper hover:bg-sun-dark"
          }`}
        >
          {applied ? "查看案件 →" : "查看並應徵 →"}
        </Link>
      </div>
    </div>
  );
}
