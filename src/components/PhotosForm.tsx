"use client";

import { useState, useTransition } from "react";
import { updatePhotos } from "@/app/dashboard/account/actions";

const MAX_PHOTOS = 5;
const MAX_FILE = 800 * 1024; // 800KB／張（base64 後約 1MB，5 張仍在 server action 上限內）

// 檔案照片牆：家長與老師共用（帳號頁／老師檔案頁），照片顯示在公開檔案
export default function PhotosForm({ initial }: { initial: string[] }) {
  const [photos, setPhotos] = useState<string[]>(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setSaved(false);
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      if (photos.length >= MAX_PHOTOS) {
        setError(`最多 ${MAX_PHOTOS} 張照片`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("請選擇圖片檔");
        return;
      }
      if (file.size > MAX_FILE) {
        setError("每張照片請小於 800KB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () =>
        setPhotos((cur) =>
          cur.length < MAX_PHOTOS ? [...cur, reader.result as string] : cur
        );
      reader.readAsDataURL(file);
    }
    setError("");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div key={i} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p}
              alt={`照片 ${i + 1}`}
              className="h-24 w-24 rounded-xl border border-line object-cover"
            />
            <button
              type="button"
              aria-label="移除照片"
              onClick={() => {
                setPhotos(photos.filter((_, idx) => idx !== i));
                setSaved(false);
              }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-white hover:bg-blush"
            >
              ✕
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line text-ink/40 transition hover:bg-sun-soft/30 hover:text-ink/70">
            <span className="text-2xl leading-none">＋</span>
            <span className="mt-1 text-xs">加照片</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={addFiles}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-ink/40">
        最多 {MAX_PHOTOS} 張、每張 800KB 內；會顯示在你的公開檔案頁（如教學環境、證書、成果照）。
      </p>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await updatePhotos(photos);
              if (res.error) return setError(res.error);
              setError("");
              setSaved(true);
            })
          }
          className="rounded-full bg-sun px-5 py-2 text-sm font-bold text-paper hover:bg-sun-dark disabled:opacity-50"
        >
          {pending ? "儲存中…" : "儲存照片"}
        </button>
        {saved && <span className="text-sm text-emerald-600">已儲存 ✓</span>}
      </div>
    </div>
  );
}
