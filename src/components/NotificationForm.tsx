"use client";

import { useActionState, useState } from "react";
import { updateNotifications } from "@/app/dashboard/account/actions";
import { SubmitButton } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

export default function NotificationForm({
  emailNotifications,
  notifyJobUpdates,
  notifyMessages,
}: {
  emailNotifications: boolean;
  notifyJobUpdates: boolean;
  notifyMessages: boolean;
}) {
  const [state, formAction] = useActionState(updateNotifications, initialState);
  const [emailOn, setEmailOn] = useState(emailNotifications);

  return (
    <form action={formAction} className="space-y-4">
      <Toggle
        name="emailNotifications"
        title="以 Email 接收通知"
        desc="開啟後，下列事件會寄送到你的註冊信箱。"
        defaultChecked={emailNotifications}
        onChange={setEmailOn}
      />
      <div
        className={`space-y-3 border-l-2 border-line/40 pl-4 ${
          emailOn ? "" : "opacity-40"
        }`}
      >
        <Toggle
          name="notifyJobUpdates"
          title="案件更新"
          desc="收到新應徵、被選上、媒合結果時通知。"
          defaultChecked={notifyJobUpdates}
        />
        <Toggle
          name="notifyMessages"
          title="新訊息"
          desc="家長或老師傳訊息給你時通知。"
          defaultChecked={notifyMessages}
        />
      </div>
      {state.success && (
        <p className="text-sm text-emerald-600">{state.success} ✓</p>
      )}
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      <SubmitButton>儲存通知設定</SubmitButton>
    </form>
  );
}

function Toggle({
  name,
  title,
  desc,
  defaultChecked,
  onChange,
}: {
  name: string;
  title: string;
  desc: string;
  defaultChecked: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="block text-xs text-ink/50">{desc}</span>
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-ink"
      />
    </label>
  );
}
