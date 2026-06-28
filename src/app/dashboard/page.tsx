import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user; // middleware 已保證登入

  // 管理員不是家長，個人面板對其無意義，直接進後台控制台
  if (user.role === "ADMIN") redirect("/admin");

  const isTutor = user.role === "TUTOR";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-4xl font-extrabold text-ink">
        嗨,{user.name} 👋
      </h1>
      <div className="mt-2 h-1 w-14 bg-sun" />
      <p className="mt-3 font-bold text-ink/60">
        你的身分是{isTutor ? "家教老師" : "家長"}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {isTutor ? (
          <>
            <DashCard
              href="/dashboard/profile"
              title="編輯我的檔案"
              desc="設定專長科目、地區、時薪與自我介紹"
            />
            <DashCard
              href="/jobs"
              title="瀏覽家教需求"
              desc="尋找適合的案件並送出應徵"
            />
            <DashCard
              href="/dashboard/applications"
              title="我的應徵"
              desc="查看你應徵過的案件與錄取狀態"
            />
          </>
        ) : (
          <>
            <DashCard
              href="/jobs/new"
              title="發布家教需求"
              desc="描述你的需求,讓老師主動應徵"
            />
            <DashCard
              href="/dashboard/jobs"
              title="我發布的需求"
              desc="管理你的案件、查看應徵者並完成配對"
            />
            <DashCard
              href="/tutors"
              title="尋找家教老師"
              desc="瀏覽並篩選適合的老師"
            />
          </>
        )}

        {/* 所有人共用 */}
        <DashCard
          href="/dashboard/account"
          title="帳號與安全"
          desc="設定公開化名、完成實名與無犯罪紀錄認證"
        />
      </div>
    </div>
  );
}

function DashCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-line bg-paper p-6 transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(60,55,45,0.10)]"
    >
      <h2 className="font-serif text-lg font-bold text-ink">
        {title}
        <span className="ml-1 inline-block transition group-hover:translate-x-1">
          →
        </span>
      </h2>
      <p className="mt-1 text-sm text-ink/60">{desc}</p>
    </Link>
  );
}
