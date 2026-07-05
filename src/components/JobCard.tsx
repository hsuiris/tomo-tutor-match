import Link from "next/link";
import FavoriteButton from "./FavoriteButton";
import { MODE_LABELS, type TeachingMode } from "@/lib/constants";
import { amountRange } from "@/lib/format";

export type JobCardData = {
  id: string;
  title: string;
  subject: string;
  level: string | null;
  regions: string[];
  mode: TeachingMode;
  budget: number | null;
  budgetMax: number | null;
  status: "OPEN" | "MATCHED" | "CLOSED";
  studentStatus: string | null;
  parentNeeds: string | null;
  createdAt: Date;
  student: { name: string };
  _count: { applications: number };
};

const STATUS_LABEL: Record<JobCardData["status"], { text: string; cls: string }> =
  {
    OPEN: { text: "徵求中", cls: "bg-mint text-ink" },
    MATCHED: { text: "已配對", cls: "bg-paper text-ink/60" },
    CLOSED: { text: "已結束", cls: "bg-paper text-ink/60" },
  };

export default function JobCard({
  job,
  favorited = false,
}: {
  job: JobCardData;
  favorited?: boolean;
}) {
  const status = STATUS_LABEL[job.status];
  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10">
        <FavoriteButton type="job" targetId={job.id} initial={favorited} />
      </div>
      <Link
        href={`/jobs/${job.id}`}
        className="block rounded-xl border border-line bg-paper p-5 transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(60,55,45,0.10)]"
      >
        <div className="flex items-start justify-between gap-3 pr-9">
        <h3 className="font-serif text-lg font-bold text-ink">{job.title}</h3>
        <span
          className={`shrink-0 rounded-full border border-line px-2.5 py-0.5 text-sm font-bold ${status.cls}`}
        >
          {status.text}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
        <span className="tag-pill rounded-full bg-sun-soft px-2.5 py-0.5 font-bold text-ink">
          {job.subject}
        </span>
        {job.level && (
          <span className="tag-pill rounded-full bg-blushbg px-2.5 py-0.5 font-bold text-ink">
            {job.level}
          </span>
        )}
        <span className="text-ink/50">📍 {job.regions.join("、")}</span>
        <span className="text-ink/50">・ {MODE_LABELS[job.mode]}</span>
      </div>

      {(job.studentStatus || job.parentNeeds) && (
        <dl className="mt-3 space-y-1.5 text-sm">
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

      <div className="mt-4 flex items-center justify-between text-sm">
        <span>
          {amountRange(job.budget, job.budgetMax) ? (
            <span className="text-xl font-extrabold tabular-nums text-ink">
              <span className="mr-0.5 text-sm font-bold text-ink/60">NT$</span>
              {amountRange(job.budget, job.budgetMax)}
              <span className="ml-0.5 text-xs font-normal text-ink/50">
                / 小時
              </span>
            </span>
          ) : (
            <span className="text-ink/50">預算面議</span>
          )}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-line bg-sun-soft px-2.5 py-0.5 text-sm font-bold text-ink">
          👨‍🏫 {job._count.applications} 位老師應徵
        </span>
      </div>
      </Link>
    </div>
  );
}
