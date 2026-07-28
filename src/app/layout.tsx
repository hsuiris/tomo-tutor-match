import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GoBack from "@/components/GoBack";
import CookieNotice from "@/components/CookieNotice";
import { siteUrl } from "@/lib/site";
import localFont from "next/font/local";

// 全站字型：思源柔黑體（GenJyuuGothic，自架）。CJK 字檔大，用 swap 先系統字頂著、載完換上。
const genJyuu = localFont({
  src: "./fonts/GenJyuuGothic-Regular.woff2",
  variable: "--font-gen-jyuu",
  display: "swap",
  fallback: ["PingFang TC", "Microsoft JhengHei", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = "Tomo 家教媒合平台";
const SITE_DESC = "找家教、接案教學，一站搞定的家教媒合平台";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: "%s · Tomo",
  },
  description: SITE_DESC,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESC,
    locale: "zh_TW",
  },
  twitter: {
    card: "summary_large_image",
  },
  // Google Search Console 驗證碼（未設定時不輸出）
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
};

// GA4 評估 ID（未設定時整段略過，本機與 preview 不會誤送資料）
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${genJyuu.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <Navbar />
        <main className="flex-1">
          <GoBack />
          {children}
        </main>
        <footer className="border-t border-line bg-[#faf8f2]">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-10 text-center">
            <span className="font-serif text-2xl font-bold tracking-tight text-ink">
              Tomo
            </span>
            <span className="text-xs tracking-wide text-ink/70">
              © {new Date().getFullYear()} Tomo ・ 家教媒合平台
            </span>
            <span className="text-xs tracking-wide text-ink/60">
              聯絡我們：
              <a
                href="mailto:tomoocustomer@gmail.com"
                className="hover:text-ink hover:underline"
              >
                tomoocustomer@gmail.com
              </a>
            </span>
            <div className="mt-1 flex gap-4">
              <Link
                href="/privacy"
                className="text-xs tracking-wide text-ink/60 hover:text-ink hover:underline"
              >
                隱私權政策與個資蒐集告知
              </Link>
              <Link
                href="/terms"
                className="text-xs tracking-wide text-ink/60 hover:text-ink hover:underline"
              >
                服務條款
              </Link>
            </div>
          </div>
        </footer>
        <CookieNotice />
        <Analytics />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
