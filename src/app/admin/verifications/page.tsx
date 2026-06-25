import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { approveVerification, rejectVerification } from "@/app/admin/actions";

const TYPE_LABEL: Record<string, string> = {
  IDENTITY: "實名認證（身分證）",
  BACKGROUND: "無犯罪紀錄（良民證）",
  EDUCATION: "學歷與成績證明",
};

export default async function AdminVerificationsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-ink/60">
        此頁面僅限管理員。
      </div>
    );
  }

  const requests = await db.verificationRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { name: true, email: true, role: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl font-extrabold text-ink">認證審核</h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-3 mb-6 text-sm font-bold text-ink/60">
        待審核 {requests.length} 筆
      </p>

      {requests.length === 0 ? (
        <div className="mt-16 text-center text-ink/40">沒有待審核的申請。</div>
      ) : (
        <ul className="space-y-4">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-4 rounded-2xl border border-line p-5 sm:flex-row"
            >
              {r.docUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.docUrl}
                  alt="證件"
                  className="h-32 w-44 shrink-0 rounded-lg border border-line object-cover"
                />
              ) : (
                <div className="flex h-32 w-44 shrink-0 items-center justify-center rounded-lg border border-line text-xs text-ink/40">
                  影像已清除
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-ink">
                  {r.user.name}{" "}
                  <span className="text-xs text-ink/40">({r.user.email})</span>
                </p>
                <p className="mt-0.5 text-sm text-ink/60">
                  {TYPE_LABEL[r.type]}
                </p>
                <p className="mt-1 text-xs text-ink/40">
                  申請於 {r.createdAt.toLocaleString("zh-TW")}
                </p>
                <div className="mt-3 flex gap-2">
                  <form action={approveVerification.bind(null, r.id)}>
                    <button className="rounded-full border border-line bg-mint px-4 py-1.5 text-sm font-bold text-ink hover:bg-mint/80">
                      通過
                    </button>
                  </form>
                  <form action={rejectVerification.bind(null, r.id)}>
                    <button className="rounded-full border border-line px-4 py-1.5 text-sm font-medium text-ink/70 hover:bg-sun-soft/40">
                      退回
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
