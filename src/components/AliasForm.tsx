"use client";

import { useActionState, useState } from "react";
import { updateAlias } from "@/app/dashboard/account/actions";
import { SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function AliasForm({
  displayName,
  realName,
  placeholder = "例如：思涵老師、Coach Chen",
}: {
  displayName: string;
  realName: string;
  placeholder?: string;
}) {
  const [state, formAction] = useActionState(updateAlias, initialState);
  // 化名剛好等於本名時視為「使用本名」
  const [mode, setMode] = useState<"alias" | "real">(
    displayName && displayName === realName ? "real" : "alias"
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-5 text-sm text-ink/70">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="nameMode"
            value="alias"
            checked={mode === "alias"}
            onChange={() => setMode("alias")}
            className="accent-ink"
          />
          使用化名
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="nameMode"
            value="real"
            checked={mode === "real"}
            onChange={() => setMode("real")}
            className="accent-ink"
          />
          使用本名（{realName}）
        </label>
      </div>
      {mode === "alias" ? (
        <>
          <input
            name="displayName"
            defaultValue={displayName === realName ? "" : displayName}
            placeholder={placeholder}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line"
          />
          <p className="text-xs text-ink/40">
            未填寫化名時,會以遮罩本名（如「王＊＊」）顯示,本名不會公開。
          </p>
        </>
      ) : (
        <p className="text-xs text-ink/40">
          你的本名「{realName}」將公開顯示於平台上。
        </p>
      )}
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600">{state.success} ✓</p>
      )}
      <SubmitButton fullWidth={false}>儲存顯示名稱</SubmitButton>
    </form>
  );
}
