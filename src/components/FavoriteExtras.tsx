"use client";

import { useState, useTransition } from "react";
import { removeFavorite, updateFavoriteNote } from "@/app/favorites/actions";

// 收藏項目的備註與刪除（掛在收藏頁每張卡片下方）
export default function FavoriteExtras({
  favoriteId,
  note,
}: {
  favoriteId: string;
  note: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-2 rounded-xl border border-dashed border-line bg-paper/60 px-3 py-2">
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="寫點備註,例如：時段可以、等回覆⋯（只有你看得到）"
            className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm outline-none focus:bg-sun-soft/30"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await updateFavoriteNote(favoriteId, draft);
                  if (res.error) return setError(res.error);
                  setError("");
                  setEditing(false);
                })
              }
              className="rounded-full bg-sun px-4 py-1.5 text-xs font-bold text-paper hover:bg-sun-dark disabled:opacity-50"
            >
              {pending ? "儲存中…" : "儲存備註"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(note ?? "");
                setEditing(false);
              }}
              className="rounded-full border border-line px-4 py-1.5 text-xs font-medium text-ink/60 hover:bg-sun-soft/40"
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-ink/70">
            {note ? (
              <>
                <span className="mr-1" aria-hidden>
                  📝
                </span>
                {note}
              </>
            ) : (
              <span className="text-ink/40">尚無備註</span>
            )}
          </p>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/70 hover:bg-sun-soft/40"
            >
              {note ? "編輯備註" : "加備註"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("確定要從收藏移除嗎？")) return;
                startTransition(() => removeFavorite(favoriteId));
              }}
              className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-blush hover:bg-blushbg/40 disabled:opacity-50"
            >
              移除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
