"use client";

import { useEffect, useState } from "react";

// 公開檔案頁的照片牆：點縮圖開全螢幕燈箱，可左右切換
export default function PhotoGallery({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i! + 1) % photos.length);
      if (e.key === "ArrowLeft")
        setOpen((i) => (i! - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`放大照片 ${i + 1}`}
            className="cursor-zoom-in overflow-hidden rounded-2xl border border-line transition hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p}
              alt={`${alt} 的照片 ${i + 1}`}
              loading="lazy"
              className="h-40 w-40 object-cover"
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <button
            type="button"
            aria-label="關閉"
            onClick={() => setOpen(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
          >
            ✕
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="上一張"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((i) => (i! - 1 + photos.length) % photos.length);
                }}
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="下一張"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((i) => (i! + 1) % photos.length);
                }}
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-2xl text-white hover:bg-white/25"
              >
                ›
              </button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[open]}
            alt={`${alt} 的照片 ${open + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </>
  );
}
