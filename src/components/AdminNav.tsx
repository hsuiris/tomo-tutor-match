"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "總覽" },
  { href: "/admin/users", label: "使用者" },
  { href: "/admin/matches", label: "媒合" },
  { href: "/admin/content", label: "內容" },
  { href: "/admin/market", label: "行情" },
  { href: "/admin/verifications", label: "認證審核" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto sm:w-40 sm:flex-col sm:overflow-visible">
      {LINKS.map((l) => {
        const active =
          l.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition ${
              active
                ? "bg-sun text-paper"
                : "text-ink/70 hover:bg-sun-soft/40"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
