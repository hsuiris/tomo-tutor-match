import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16 把 middleware 慣例改名為 proxy。
// next-auth 的 auth() 包裝器本身就是執行 authorized callback 的請求處理函式。
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // 排除 api、靜態資源
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
