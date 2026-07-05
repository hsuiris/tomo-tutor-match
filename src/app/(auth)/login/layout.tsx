import type { Metadata } from "next";

// page 是 client component，metadata 由這層 layout 提供
export const metadata: Metadata = {
  title: "登入",
  description: "登入 Tomo，管理你的家教需求與接案。",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
