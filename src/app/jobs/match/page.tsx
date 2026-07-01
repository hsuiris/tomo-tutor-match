import { redirect } from "next/navigation";

// 智能接案已併入「找學生」頁（?view=match）。保留舊網址→轉址。
export default function JobMatchRedirect() {
  redirect("/jobs?view=match");
}
