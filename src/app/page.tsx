import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import MatchForm from "@/components/MatchForm";
import TutorCard, { type TutorCardData } from "@/components/TutorCard";
import { SUBJECTS } from "@/lib/constants";

// 首頁熱門科目（取常見幾科當入口）
const POPULAR_SUBJECTS = ["數學", "英文", "國文", "物理", "化學", "程式設計", "鋼琴", "美術"];

export default async function HomePage() {
  // 精選推薦老師：優先已認證、再依評價（與「推薦」排序一致）
  const featured = (await db.tutorProfile.findMany({
    where: { isPublished: true },
    orderBy: [
      { user: { idVerified: "desc" } },
      { ratingAvg: "desc" },
      { ratingCount: "desc" },
    ],
    take: 3,
    select: {
      id: true,
      bio: true,
      subjects: true,
      levels: true,
      regions: true,
      hourlyRate: true,
      mode: true,
      university: true,
      eduLevel: true,
      ratingAvg: true,
      ratingCount: true,
      user: {
        select: {
          name: true,
          displayName: true,
          avatarUrl: true,
          idVerified: true,
          bgCheckVerified: true,
          eduVerified: true,
        },
      },
    },
  })) as TutorCardData[];

  const session = await auth();
  const favTutorIds = session
    ? new Set(
        (
          await db.favorite.findMany({
            where: { userId: session.user.id, tutorProfileId: { not: null } },
            select: { tutorProfileId: true },
          })
        ).map((f) => f.tutorProfileId)
      )
    : new Set<string | null>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      {/* Hero：智能匹配為核心 */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-sun-soft via-paper to-blushbg px-6 py-14 shadow-card sm:px-14 sm:py-20">
        <span className="absolute -right-16 -top-10 hidden h-56 w-56 rounded-full bg-mint/40 blur-2xl sm:block" />
        <span className="absolute right-32 top-44 hidden h-24 w-24 rounded-full bg-blush/30 blur-xl sm:block" />
        <span className="absolute -bottom-12 left-1/4 hidden h-32 w-32 rounded-full bg-sun/20 blur-2xl sm:block" />

        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-1 text-xs font-bold tracking-wide text-ink">
            <span className="h-2 w-2 rounded-full bg-cobalt" />
            智能家教媒合
          </span>
          <h1 className="mt-6 font-serif text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
            找到真正
            <br />
            適合你的老師。
          </h1>
          <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-ink/80">
            說出需求，智能匹配立刻幫你算出最契合的老師——
            還告訴你「為什麼推薦」，讓媒合不再靠運氣。
          </p>

          {/* 快速配對表單 */}
          <div className="mt-7">
            <MatchForm variant="compact" />
          </div>

          <p className="mt-3 text-xs font-bold text-ink/60">
            想設定更多條件？
            <Link href="/match" className="underline underline-offset-2 hover:text-ink">
              前往完整智能配對 →
            </Link>
          </p>
        </div>
      </section>

      {/* 熱門科目 */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-2xl font-bold text-ink">熱門科目</h2>
          <Link
            href="/tutors"
            className="text-sm font-bold text-ink/50 underline underline-offset-2 hover:text-ink"
          >
            查看全部 →
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {POPULAR_SUBJECTS.filter((s) => (SUBJECTS as readonly string[]).includes(s)).map(
            (s) => (
              <Link
                key={s}
                href={`/match?subject=${encodeURIComponent(s)}`}
                className="rounded-full border border-line bg-paper px-5 py-2 text-sm font-bold text-ink transition hover:bg-sun"
              >
                {s}
              </Link>
            )
          )}
        </div>
      </section>

      {/* 精選推薦老師 */}
      {featured.length > 0 && (
        <section className="mt-10">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-bold text-ink">精選推薦老師</h2>
            <Link
              href="/tutors"
              className="text-sm font-bold text-ink/50 underline underline-offset-2 hover:text-ink"
            >
              查看全部老師 →
            </Link>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <TutorCard key={t.id} tutor={t} favorited={favTutorIds.has(t.id)} />
            ))}
          </div>
        </section>
      )}

      {/* 為什麼選擇 */}
      <section className="mt-10 rounded-2xl border border-line bg-[#faf8f2] px-6 py-12 sm:px-14 sm:py-16">
        <SectionHeading
          title="為什麼選擇 TutorMatch"
          leftImg="/student1.png"
          rightImg="/student2.png"
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-4">
          {[
            { title: "智能匹配", desc: "依需求算契合度並解釋推薦原因，省去大海撈針。" },
            { title: "嚴格審核", desc: "實名、良民證、學歷三重認證，身分看得見。" },
            { title: "化名保護", desc: "對外只顯示化名，本名不外流，互動更安心。" },
            { title: "雙向評分", desc: "完成媒合後互相評分，真實口碑累積信任。" },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-line bg-paper p-6 transition hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(60,55,45,0.10)]"
            >
              <h3 className="font-serif text-lg font-bold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 怎麼運作 */}
      <section className="mt-6 rounded-2xl border border-line bg-[#faf8f2] px-6 py-12 sm:px-14 sm:py-16">
        <SectionHeading title="如何運作" />
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            { step: "01", title: "描述需求", desc: "選科目、學制、地區、預算，並選你最在意的重點。", dot: "bg-sun" },
            { step: "02", title: "智能配對", desc: "系統算出契合度排序，並說明為什麼推薦每位老師。", dot: "bg-cobalt" },
            { step: "03", title: "預約洽談", desc: "看到合適的老師，一鍵發起私訊預約，開始上課。", dot: "bg-cobalt" },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-line bg-paper p-7 transition hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-3xl font-bold text-ink">{item.step}</span>
                <span className={`h-4 w-4 rounded-full border border-line ${item.dot}`} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// 區段標題：中文標題置中，兩側放上學生插圖
function SectionHeading({
  title,
  leftImg,
  rightImg,
}: {
  title: string;
  leftImg?: string;
  rightImg?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      {leftImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={leftImg} alt="" className="hidden h-24 w-auto object-contain sm:block" />
      )}
      <div className="text-center">
        <h2 className="font-serif text-3xl font-extrabold text-ink sm:text-4xl">
          {title}
        </h2>
        <div className="mx-auto mt-2 h-1 w-16 bg-sun" />
      </div>
      {rightImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={rightImg} alt="" className="hidden h-24 w-auto object-contain sm:block" />
      )}
    </div>
  );
}
