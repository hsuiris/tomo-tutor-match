"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, updateJob } from "@/app/jobs/actions";
import { SUBJECTS, levelsForSubject } from "@/lib/constants";
import RegionPicker from "@/components/RegionPicker";
import { SubmitButton, useFocusFirstError } from "@/components/ui/form";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {};

// 建立與編輯共用：帶 jobId + initial 即為編輯模式
export default function JobForm({
  jobId,
  initial,
  initialRegions,
}: {
  jobId?: string;
  initial?: Record<string, string>;
  initialRegions?: string[];
} = {}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    jobId ? updateJob : createJob,
    initialState
  );
  useFocusFirstError(state);
  const err = state.fieldErrors;
  // 出錯回填優先，其次是編輯模式的既有值
  const v = state.values ?? initial;

  // 科目決定年級／程度選項（技能類用 入門/初階/進階）
  const [subject, setSubject] = useState<string>(v?.subject ?? "");
  const [level, setLevel] = useState<string>(v?.level ?? "");
  // 地區多選（client state 在驗證失敗時自然保留）
  const [regions, setRegions] = useState<string[]>(initialRegions ?? []);
  const levelOptions = levelsForSubject(subject);

  // 出錯時顯示紅字錯誤，否則顯示灰字限制提示
  const msg = (errs: string[] | undefined, hint: string) =>
    errs?.length ? (
      errs.map((e) => (
        <p key={e} className="mt-1 text-xs text-red-500">
          {e}
        </p>
      ))
    ) : (
      <p className="mt-1 text-xs text-ink/40">{hint}</p>
    );

  // 發布成功後導轉到案件頁
  useEffect(() => {
    if (state.redirectTo) router.push(state.redirectTo);
  }, [state.redirectTo, router]);

  const inputCls =
    "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line";
  const textareaCls =
    "w-full rounded-2xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line";

  return (
    <form action={formAction} className="space-y-5">
      {jobId && <input type="hidden" name="jobId" value={jobId} />}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">
          標題 <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          placeholder="例如：高一數學,加強三角函數"
          defaultValue={v?.title}
          className={inputCls}
        />
        {msg(err?.title, "至少 4 個字")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">
            科目 <span className="text-red-500">*</span>
          </label>
          <select
            name="subject"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              // 換科目後若原年級不在新選項內就清掉
              const allowed = new Set(levelsForSubject(e.target.value));
              setLevel((cur) => (allowed.has(cur) ? cur : ""));
            }}
            className={inputCls}
          >
            <option value="" disabled>
              請選擇
            </option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {err?.subject?.map((e) => (
            <p key={e} className="mt-1 text-xs text-red-500">
              {e}
            </p>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">
            學生年級／程度 <span className="text-red-500">*</span>
          </label>
          <select
            name="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            disabled={!subject}
            className={inputCls}
          >
            <option value="" disabled>
              {subject ? "請選擇" : "請先選科目"}
            </option>
            {levelOptions.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
          {err?.level?.map((e) => (
            <p key={e} className="mt-1 text-xs text-red-500">
              {e}
            </p>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">
            授課方式
          </label>
          <select name="mode" defaultValue={v?.mode ?? "BOTH"} className={inputCls}>
            <option value="BOTH">線上 / 實體皆可</option>
            <option value="ONLINE">僅線上</option>
            <option value="IN_PERSON">僅實體</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">
          上課地區（可複選） <span className="text-red-500">*</span>
        </label>
        <RegionPicker value={regions} onChange={setRegions} name="regions" />
        {err?.regions?.map((e) => (
          <p key={e} className="mt-1 text-xs text-red-500">
            {e}
          </p>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">
          預算（每小時,新台幣）
        </label>
        <div className="flex items-center gap-2">
          <input
            name="budget"
            type="number"
            placeholder="最低"
            defaultValue={v?.budget}
            className={inputCls}
          />
          <span className="text-ink/40">–</span>
          <input
            name="budgetMax"
            type="number"
            placeholder="最高"
            defaultValue={v?.budgetMax}
            className={inputCls}
          />
        </div>
        {(err?.budget ?? err?.budgetMax)?.map((e) => (
          <p key={e} className="mt-1 text-xs text-red-500">
            {e}
          </p>
        ))}
        <p className="mt-1 text-xs text-ink/40">可留空或只填一邊，例如「800 起」</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">
          學生狀況 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="studentStatus"
          rows={3}
          placeholder="例如：高一升高二,數學基礎較弱,段考約 60 分,想跟上進度"
          defaultValue={v?.studentStatus}
          className={textareaCls}
        />
        {msg(err?.studentStatus, "至少 5 個字")}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">
          家長訴求 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="parentNeeds"
          rows={3}
          placeholder="例如：希望加強三角函數與考試技巧,耐心、能引導思考的老師"
          defaultValue={v?.parentNeeds}
          className={textareaCls}
        />
        {msg(err?.parentNeeds, "至少 5 個字")}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">
          其他補充說明
        </label>
        <textarea
          name="description"
          rows={4}
          placeholder="上課時間偏好、其他希望的老師條件等"
          defaultValue={v?.description}
          className={textareaCls}
        />
        {msg(err?.description, "選填")}
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton>{jobId ? "儲存變更" : "發布需求"}</SubmitButton>
    </form>
  );
}
