import { db } from "@/lib/db";
import { SUBJECTS, ALL_LEVELS as LEVELS, REGIONS } from "@/lib/constants";
import { aggregateMarket, type RateRow } from "@/lib/market";

export const metadata = { title: "家教行情分析 · Tomo" };

function RateTable({ title, rows }: { title: string; rows: RateRow[] }) {
  return (
    <section>
      <h2 className="mb-3 font-bold text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink/40">尚無資料</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-paper">
          <table className="w-full text-sm">
            <thead className="bg-sun-soft/30 text-left text-ink/60">
              <tr>
                <th className="px-3 py-2 font-bold">維度</th>
                <th className="px-3 py-2 font-bold">樣本</th>
                <th className="px-3 py-2 font-bold">平均</th>
                <th className="px-3 py-2 font-bold">最低</th>
                <th className="px-3 py-2 font-bold">最高</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-line">
                  <td className="px-3 py-2 font-bold text-ink">{r.key}</td>
                  <td className="px-3 py-2 text-ink/50">{r.count}</td>
                  <td className="px-3 py-2 font-bold text-ink">${r.avg}</td>
                  <td className="px-3 py-2 text-ink/60">${r.min}</td>
                  <td className="px-3 py-2 text-ink/60">${r.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function AdminMarketPage() {
  // admin 版：納入未上架老師（公開 /stats 只取 isPublished）
  const [tutors, jobs] = await Promise.all([
    db.tutorProfile.findMany({
      select: { hourlyRate: true, subjects: true, levels: true, regions: true },
    }),
    db.jobPost.findMany({ select: { budget: true } }),
  ]);

  const m = aggregateMarket(tutors, jobs, {
    subjects: SUBJECTS,
    levels: LEVELS,
    regions: REGIONS,
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-extrabold text-ink">
          家教行情分析
        </h1>
        <div className="mt-2 h-1 w-14 bg-sun" />
        <p className="mt-3 text-sm font-bold text-ink/60">
          含未上架老師。供給（老師時薪）平均 ${m.supplyAvg} ・ 需求（家長預算）平均 $
          {m.demandAvg} ・ {m.tutorCount} 位老師 / {m.jobCount} 件案件
        </p>
      </div>

      <RateTable title="依科目" rows={m.bySubject} />
      <RateTable title="依學制" rows={m.byLevel} />
      <RateTable title="依地區" rows={m.byRegion} />
    </div>
  );
}
