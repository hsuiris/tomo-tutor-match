"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/favorites/actions";

export default function FavoriteButton({
  type,
  targetId,
  initial,
}: {
  type: "tutor" | "job";
  targetId: string;
  initial: boolean;
}) {
  const [fav, setFav] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={fav ? "取消收藏" : "加入收藏"}
      title={fav ? "取消收藏" : "加入收藏"}
      disabled={pending}
      onClick={(e) => {
        // 卡片本身是連結,點愛心不要觸發導航
        e.preventDefault();
        e.stopPropagation();
        const next = !fav;
        setFav(next); // 樂觀更新
        start(async () => {
          const res = await toggleFavorite(type, targetId);
          if (res.error === "login") {
            setFav(false);
            router.push("/login");
          } else if (typeof res.favorited === "boolean") {
            setFav(res.favorited);
            router.refresh();
          }
        });
      }}
      className="rounded-full border border-line bg-paper p-1.5 shadow-sm transition hover:bg-blushbg disabled:opacity-50"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={fav ? "#ff5d8f" : "none"}
        stroke="#1a1a1a"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}
