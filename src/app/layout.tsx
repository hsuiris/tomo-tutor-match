import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_TC, Playfair_Display } from "next/font/google";
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
});

export const metadata: Metadata = {
  title: "TutorMatch 家教媒合平台",
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
        <footer className="border-t border-line bg-[#f3eee1]">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-10 text-center">
            <span className="font-serif text-2xl font-bold tracking-tight text-ink">
              TutorMatch
            </span>
            <span className="text-xs tracking-wide text-ink/70">
              © {new Date().getFullYear()} TutorMatch ・ 家教媒合平台
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
