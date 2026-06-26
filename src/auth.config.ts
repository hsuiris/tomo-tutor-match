import type { NextAuthConfig } from "next-auth";

// Edge-safe 設定：不含 bcrypt / Prisma（這些放在 auth.ts 的 Credentials provider）
// middleware 只會用到這份設定來做路由保護
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // 把使用者 id 與身分寫進 JWT
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // 讓 session.user 帶上 id 與 role
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "STUDENT" | "TUTOR" | "ADMIN";
      }
      return session;
    },
    // 路由保護：未登入者導向登入頁
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = ["/dashboard", "/jobs/new", "/admin", "/messages"];
      const isProtected = protectedPaths.some((p) =>
        nextUrl.pathname.startsWith(p)
      );
      if (isProtected) return isLoggedIn;
      return true;
    },
  },
  providers: [], // 在 auth.ts 補上 Credentials
} satisfies NextAuthConfig;
