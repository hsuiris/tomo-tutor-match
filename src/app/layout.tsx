import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_TC, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 編輯風 serif：Latin 用 Playfair Display，中文用 Noto Serif TC
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const notoSerifTC = Noto_Serif_TC({
  variable: "--font-serif-tc",
  weight: ["500", "600", "700", "900"],
  // CJK 字檔大、無法 preload；用 optional + 等寬度量替代字型，
  // 避免標題晚出現時的閃動，字體下載快取後即時套用
  display: "optional",
});

export const metadata: Metadata = {
  title: "Tomo 家教媒合平台",
  description: "找家教、接案教學，一站搞定的家教媒合平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${notoSerifTC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line bg-[#faf8f2]">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-10 text-center">
            <span className="font-serif text-2xl font-bold tracking-tight text-ink">
              Tomo
            </span>
            <span className="text-xs tracking-wide text-ink/70">
              © {new Date().getFullYear()} Tomo ・ 家教媒合平台
            </span>
            <Link
              href="/privacy"
              className="mt-1 text-xs tracking-wide text-ink/60 hover:text-ink hover:underline"
            >
              隱私權政策與個資蒐集告知
            </Link>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
