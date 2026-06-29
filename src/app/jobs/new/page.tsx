import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import JobForm from "@/components/JobForm";
import AliasForm from "@/components/AliasForm";

export default async function NewJobPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, displayName: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink">發布家教需求</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-1 mb-6 text-sm text-ink/60">
        描述你的需求,讓適合的老師主動應徵。
      </p>

      {/* 公開化名 */}
      <section className="mb-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <h2 className="mb-1 font-bold text-ink">公開化名</h2>
        <p className="mb-4 text-xs text-ink/40">
          你的本名是「{user.name}」,僅平台保留;對外只顯示化名。
        </p>
        <AliasForm displayName={user.displayName ?? ""} />
      </section>

      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm sm:p-8">
        <JobForm />
      </div>
    </div>
  );
}
