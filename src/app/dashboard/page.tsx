import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasTutorProfile } from "@/lib/tutor";
import { becomeTutor } from "./actions";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user; // middleware 已保證登入

  // 管理員不是家長，個人面板對其無意義，直接進後台控制台
  if (user.role === "ADMIN") redirect("/admin");

  // 能不能教學看「有沒有老師檔案」，不看 JWT role（升級後 JWT 不會即時更新）
  const isTutor = await hasTutorProfile(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* 標頭：問候 + 右上角帳號與安全 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-extrabold text-ink">
            嗨,{user.name} 👋
          </h1>
          <div className="mt-2 h-1 w-14 bg-sun" />
        </div>
        <Link
          href="/dashboard/account"
          className="shrink-0 rounded-full border border-line px-4 py-2 text-sm font-bold text-ink transition hover:bg-sun"
        >
          帳號與安全 →
        </Link>
      </div>

      {/* 兩欄：左＝我要學習、右＝我要教學，各自一直列 */}
      <div className="mt-10 grid items-start gap-6 sm:grid-cols-2">
        {/* 學習：發需求找老師（所有人都能用） */}
        <section>
          <h2 className="mb-3 font-serif text-lg font-bold text-ink/80">
            🎒 我要學習(找老師)
          </h2>
          <div className="space-y-4">
            <DashCard
              href="/jobs/new"
              title="發布學習需求"
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
          </div>
        </section>

        {/* 教學：應徵需求找學生（要有老師檔案才開放） */}
        <section>
          <h2 className="mb-3 font-serif text-lg font-bold text-ink/80">
            📚 我要教學(找學生)
          </h2>
          <div className="space-y-4">
            {isTutor ? (
              <>
                <DashCard
                  href="/dashboard/profile"
                  title="編輯我的老師檔案"
                  desc="專長、時薪、自我介紹、公開化名與安全認證"
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
              <form action={becomeTutor}>
                <button
                  type="submit"
                  className="group w-full rounded-xl border border-dashed border-sun bg-sun-soft/30 p-6 text-left transition hover:-translate-y-1 hover:bg-sun-soft/50"
                >
                  <span className="font-serif text-lg font-bold text-ink">
                    成為老師
                    <span className="ml-1 inline-block transition group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                  <p className="mt-1 text-sm text-ink/60">
                    建立老師檔案就能應徵學生的需求。接著完成實名/學歷認證,更容易被選上。
                  </p>
                </button>
              </form>
            )}
          </div>
        </section>
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
      className="group block rounded-xl border border-line bg-paper p-6 transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(60,55,45,0.10)]"
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
