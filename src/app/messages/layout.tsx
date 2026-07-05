import { redirect } from "next/navigation";
import { auth } from "@/auth";

// 訊息中心：登入即可「閱讀」收到的訊息（未驗證 Email 也看得到，
// 避免收到訊息卻不知道）；「發送」在 sendMessage/startConversation
// action 層仍要求完成驗證
export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  return children;
}
