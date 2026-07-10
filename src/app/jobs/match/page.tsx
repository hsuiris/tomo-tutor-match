import { redirect } from "next/navigation";

// 「智能接案」已併入「找學生」頁的瀏覽。保留舊網址→轉址。
export default function JobMatchRedirect() {
  redirect("/jobs");
}
