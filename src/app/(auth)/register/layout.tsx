import type { Metadata } from "next";

// page 是 client component，metadata 由這層 layout 提供
export const metadata: Metadata = {
  title: "註冊",
  description: "免費註冊 Tomo，刊登家教需求或建立老師檔案，開始媒合。",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
