import { auth } from "@/auth";
import { redirect } from "next/navigation";
import JobForm from "@/components/JobForm";

export default async function NewJobPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink">發布家教需求</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-1 mb-6 text-sm text-ink/60">
        描述你的需求,讓適合的老師主動應徵。
      </p>
      <JobForm />
    </div>
  );
}
