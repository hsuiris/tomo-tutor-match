"use client";

import { useActionState } from "react";
import { updateAlias } from "@/app/dashboard/account/actions";
import { SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function AliasForm({ displayName }: { displayName: string }) {
  const [state, formAction] = useActionState(updateAlias, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input
        name="displayName"
        defaultValue={displayName}
        placeholder="例如：思涵老師、Coach Chen"
        className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
      />
      <p className="text-xs text-ink/40">
        平台對外只顯示化名;未設定時會以遮罩本名（如「王＊＊」）顯示,本名不會公開。
      </p>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600">{state.success} ✓</p>
      )}
      <SubmitButton fullWidth={false}>儲存化名</SubmitButton>
    </form>
  );
}
