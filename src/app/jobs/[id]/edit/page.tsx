import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import JobForm from "@/components/JobForm";

export const metadata = { title: "編輯需求" };

// 案主編輯自己發布的家教需求（僅限徵求中）
export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const job = await db.jobPost.findUnique({ where: { id } });
  if (!job) notFound();
  if (job.studentId !== session.user.id) redirect(`/jobs/${id}`);
  if (job.status !== "OPEN") redirect(`/jobs/${id}`);

  const initial = {
    title: job.title,
    subject: job.subject,
    level: job.level ?? "",
    mode: job.mode,
    budget: job.budget?.toString() ?? "",
    budgetMax: job.budgetMax?.toString() ?? "",
    description: job.description,
    studentStatus: job.studentStatus ?? "",
    parentNeeds: job.parentNeeds ?? "",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink">編輯家教需求</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-1 mb-6 text-sm text-ink/60">
        修改後已應徵的老師也會看到最新內容。
      </p>
      <JobForm jobId={job.id} initial={initial} initialRegions={job.regions} />
    </div>
  );
}
