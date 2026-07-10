import { redirect } from "next/navigation";

// 「智能配對」已併入「找老師」頁的篩選。保留舊網址→轉址並帶上可對應的條件。
export default async function MatchRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    // view/priority/mode 是舊配對專用參數，篩選頁沒有 → 略過
    if (k === "view" || k === "priority" || k === "mode") continue;
    // 舊的 budget（預算上限）對應篩選頁的 max（時薪上限）
    const key = k === "budget" ? "max" : k;
    if (Array.isArray(v)) v.forEach((x) => qs.append(key, x));
    else if (v != null) qs.set(key, v);
  }
  const query = qs.toString();
  redirect(query ? `/tutors?${query}` : "/tutors");
}
