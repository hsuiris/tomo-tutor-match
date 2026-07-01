import { redirect } from "next/navigation";

// 智能匹配已併入「找老師」頁（?view=match）。保留舊網址→轉址並帶上原本條件。
export default async function MatchRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  qs.set("view", "match");
  for (const [k, v] of Object.entries(sp)) {
    if (k === "view") continue;
    if (Array.isArray(v)) v.forEach((x) => qs.append(k, x));
    else if (v != null) qs.set(k, v);
  }
  redirect(`/tutors?${qs.toString()}`);
}
