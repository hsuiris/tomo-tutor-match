import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import JobCard from "@/components/JobCard";

export default async function MyJobsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const jobs = await db.jobPost.findMany({
    where: { studentId: session.user.id },
    orderBy: { createdAt: "desc" },
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
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-extrabold text-ink">我發布的需求</h1>
        <Link
          href="/jobs/new"
          className="rounded-full bg-sun px-4 py-2 text-sm font-bold text-paper hover:bg-sun/80"
        >
          發布需求
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-16 text-center text-ink/40">
          你還沒有發布任何需求。
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {jobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}
