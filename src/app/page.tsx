import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import TutorQuickSearch from "@/components/TutorQuickSearch";
import TutorCard, { type TutorCardData } from "@/components/TutorCard";
import { SUBJECTS } from "@/lib/constants";
import { Noto_Serif_TC } from "next/font/google";

// 首頁主標題用明體（思源宋體）：端莊氣質。只在首頁載入，display: swap 先系統字頂著
const displaySerif = Noto_Serif_TC({ weight: ["900"], display: "swap" });

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
      hourlyRateMax: true,
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
      {/* Hero：搜尋為核心 */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-sun-soft via-paper to-blushbg px-6 py-14 shadow-card sm:px-14 sm:py-20">
        <span className="absolute -right-16 -top-10 hidden h-56 w-56 rounded-full bg-mint/40 blur-2xl sm:block" />
        <span className="absolute right-32 top-44 hidden h-24 w-24 rounded-full bg-blush/30 blur-xl sm:block" />
        <span className="absolute -bottom-12 left-1/4 hidden h-32 w-32 rounded-full bg-sun/20 blur-2xl sm:block" />

        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-1 text-xs font-bold tracking-wide text-ink">
            <span className="h-2 w-2 rounded-full bg-cobalt" />
            家教媒合平台
          </span>
          <h1 className={`${displaySerif.className} mt-6 text-4xl font-black leading-tight text-ink sm:text-5xl`}>
            找到真正適合你的老師
          </h1>
          <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-ink/80">
            輸入你的需求，快速找到符合條件的老師，
            透過完整履歷、驗證資訊與真實評價，輕鬆做出安心的選擇。
          </p>

          {/* 快速搜尋表單 */}
          <div className="mt-7">
            <TutorQuickSearch />
          </div>

          <p className="mt-3 text-xs font-bold text-ink/60">
            想要更多篩選條件？
            <Link href="/tutors" className="underline underline-offset-2 hover:text-ink">
              前往完整篩選 →
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
                href={`/tutors?subject=${encodeURIComponent(s)}`}
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
          title="為什麼選擇 Tomo"
          leftImg="/student1.png"
          rightImg="/student2.png"
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-4">
          {[
            { title: "透明比較", desc: "科目、時薪、學經歷、評價一次看清，好做決定。" },
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
            { step: "01", title: "設定條件", desc: "選科目、學制、地區與預算。", dot: "bg-sun" },
            { step: "02", title: "篩選比較", desc: "依條件篩出人選，比較檔案、驗證資訊與評價。", dot: "bg-cobalt" },
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
        <Image
          src={leftImg}
          alt=""
          width={96}
          height={96}
          className="hidden h-24 w-auto object-contain sm:block"
        />
      )}
      <div className="text-center">
        <h2 className="font-serif text-3xl font-extrabold text-ink sm:text-4xl">
          {title}
        </h2>
        <div className="mx-auto mt-2 h-1 w-16 bg-sun" />
      </div>
      {rightImg && (
        <Image
          src={rightImg}
          alt=""
          width={96}
          height={96}
          className="hidden h-24 w-auto object-contain sm:block"
        />
      )}
    </div>
  );
}
