"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/favorites/actions";
import HeartIcon from "@/components/HeartIcon";

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
      <HeartIcon
        className="h-4 w-4"
        fill={fav ? "#ff5d8f" : "none"}
        stroke="#1a1a1a"
        strokeWidth="2.2"
      />
    </button>
  );
}
