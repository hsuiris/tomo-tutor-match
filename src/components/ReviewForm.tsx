"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitReview } from "@/app/u/[id]/actions";
import { SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function ReviewForm({
  revieweeId,
  revieweeName,
}: {
  revieweeId: string;
  revieweeName: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(submitReview, initialState);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state, router]);

  if (state.success) {
    return (
      <p className="rounded-xl border border-line bg-mint px-4 py-3 text-sm font-bold text-ink">
        {state.success} ✓
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="revieweeId" value={revieweeId} />
      <input type="hidden" name="rating" value={rating} />

      <p className="text-sm text-ink/70">
        為 <span className="font-bold text-ink">{revieweeName}</span> 評分：
      </p>
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className={
              (hover || rating) >= n ? "text-amber-400" : "text-ink/20"
            }
            aria-label={`${n} 星`}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        name="comment"
        rows={3}
        placeholder="分享上課心得,幫助其他家長與學生（選填）"
        defaultValue={state.values?.comment}
        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm font-medium outline-none placeholder:text-ink/40 focus:bg-sun-soft/40"
      />

      {state.error && (
        <p className="rounded-xl border border-line bg-blushbg px-3 py-2 text-sm font-bold text-ink">
          {state.error}
        </p>
      )}

      <SubmitButton>送出評價</SubmitButton>
    </form>
  );
}
