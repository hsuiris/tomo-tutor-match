"use client";

import { useActionState, useState, type ReactNode } from "react";
import { updateProfile } from "@/app/dashboard/profile/actions";
import {
  SUBJECTS,
  EDU_LEVELS,
  levelsForSubjects,
  type TeachingMode,
  type Gender,
} from "@/lib/constants";
import Avatar from "@/components/Avatar";
import RateRulesField from "@/components/RateRulesField";
import ExamScoresField from "@/components/ExamScoresField";
import AvailabilityField from "@/components/AvailabilityField";
import type {
  ExamScore,
  RateRule,
  Availability,
} from "@/lib/profile-detail";
import { useFocusFirstError } from "@/components/ui/form";
import RegionPicker from "@/components/RegionPicker";
import type { ActionState } from "@/lib/types";

export type ProfileInitial = {
  name: string;
  bio: string;
  subjects: string[];
  levels: string[];
  regions: string[];
  hourlyRate: string;
  hourlyRateMax: string;
  experience: string;
  education: string;
  university: string;
  eduLevel: string;
  mode: TeachingMode;
  gender: Gender;
  avatarUrl: string;
  exams: ExamScore[];
  rateRules: RateRule[];
  availability: Availability | null;
};

const initialState: ActionState = {};

export default function ProfileForm({
  initial,
  aliasSlot,
}: {
  initial: ProfileInitial;
  aliasSlot?: ReactNode;
}) {
  const [state, formAction] = useActionState(updateProfile, initialState);
  useFocusFirstError(state);
  const [subjects, setSubjects] = useState<string[]>(initial.subjects);
  const [levels, setLevels] = useState<string[]>(initial.levels);
  const [regions, setRegions] = useState<string[]>(initial.regions);
  const [gender, setGender] = useState<Gender>(initial.gender);
  const [avatar, setAvatar] = useState<string>(initial.avatarUrl);
  const [avatarError, setAvatarError] = useState<string>("");

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("請選擇圖片檔");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("圖片請小於 2MB");
      return;
    }
    setAvatarError("");
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggle(
    list: string[],
    setList: (v: string[]) => void,
    value: string
  ) {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  // 程度選項依所選科目而定（技能類用 入門/初階/進階）
  const levelOptions = levelsForSubjects(subjects);

  // 切換科目時，移除已不適用的程度
  function toggleSubject(s: string) {
    const next = subjects.includes(s)
      ? subjects.filter((x) => x !== s)
      : [...subjects, s];
    setSubjects(next);
    const allowed = new Set(levelsForSubjects(next));
    setLevels((cur) => cur.filter((l) => allowed.has(l)));
  }

  const err = state.fieldErrors;
  // 出錯後回填剛輸入的值，沒有則用已儲存的值
  const v = state.values;

  return (
    <>
      {/* 頭像 */}
      <div className="flex items-center gap-4">
        <Avatar name={initial.name} url={avatar || null} size={72} />
        <div>
          <label className="inline-block cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium text-ink/80 hover:bg-sun-soft/40">
            上傳頭像
            <input
              type="file"
              accept="image/*"
              onChange={onPickAvatar}
              className="hidden"
            />
          </label>
          <p className="mt-1 text-xs text-ink/40">JPG / PNG,小於 2MB</p>
          {avatarError && (
            <p className="mt-1 text-xs text-red-500">{avatarError}</p>
          )}
        </div>
      </div>

      <form action={formAction} className="mt-6 space-y-6">
        <input type="hidden" name="avatarUrl" value={avatar} />

      {/* 公開化名（緊接大頭照下面），隨「儲存檔案」一併保存 */}
      {aliasSlot}

      {/* 性別 */}
      <div>
        <span className="mb-2 block text-sm font-medium text-ink/80">
          性別
        </span>
        <div className="flex gap-2">
          {(
            [
              { value: "MALE", label: "男" },
              { value: "FEMALE", label: "女" },
              { value: "UNDISCLOSED", label: "不公開" },
            ] as const
          ).map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-lg border px-4 py-1.5 text-sm transition ${
                gender === opt.value
                  ? "border-line bg-sun text-paper"
                  : "border-line text-ink/70 hover:border-line"
              }`}
            >
              <input
                type="radio"
                name="gender"
                value={opt.value}
                checked={gender === opt.value}
                onChange={() => setGender(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* 科目 */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink/80">
          專長科目 <span className="text-red-500">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => {
            const active = subjects.includes(s);
            return (
              <label
                key={s}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
                  active
                    ? "border-line bg-sun text-paper"
                    : "border-line text-ink/70 hover:border-line"
                }`}
              >
                <input
                  type="checkbox"
                  name="subjects"
                  value={s}
                  checked={active}
                  onChange={() => toggleSubject(s)}
                  className="sr-only"
                />
                {s}
              </label>
            );
          })}
        </div>
        {err?.subjects?.map((e) => (
          <p key={e} className="mt-1 text-xs text-red-500">
            {e}
          </p>
        ))}
      </fieldset>

      {/* 可教學制／程度 */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink/80">
          可教年級／程度 <span className="text-red-500">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {levelOptions.map((lv) => {
            const active = levels.includes(lv);
            return (
              <label
                key={lv}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
                  active
                    ? "border-line bg-sun text-paper"
                    : "border-line text-ink/70 hover:border-line"
                }`}
              >
                <input
                  type="checkbox"
                  name="levels"
                  value={lv}
                  checked={active}
                  onChange={() => toggle(levels, setLevels, lv)}
                  className="sr-only"
                />
                {lv}
              </label>
            );
          })}
        </div>
        {err?.levels?.map((e) => (
          <p key={e} className="mt-1 text-xs text-red-500">
            {e}
          </p>
        ))}
      </fieldset>

      {/* 履歷（依序：學歷、教學經驗、自我介紹） */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">
            教育程度
          </label>
          <select
            name="eduLevel"
            defaultValue={v?.eduLevel ?? initial.eduLevel}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line"
          >
            <option value="">未填寫</option>
            {EDU_LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">
            畢業／就讀大學 <span className="text-red-500">*</span>
          </label>
          <input
            name="university"
            defaultValue={v?.university ?? initial.university}
            placeholder="例如：國立台灣大學"
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line"
          />
          {err?.university?.map((e) => (
            <p key={e} className="mt-1 text-xs text-red-500">
              {e}
            </p>
          ))}
        </div>
      </div>
      <TextArea
        name="education"
        label="科系／詳細學歷"
        required
        defaultValue={v?.education ?? initial.education}
        placeholder="例如：數學系學士、資工所碩士"
        errors={err?.education}
      />
      <TextArea
        name="experience"
        label="教學經驗"
        required
        defaultValue={v?.experience ?? initial.experience}
        placeholder="例如：5 年家教經驗,帶過 30+ 位學生"
        errors={err?.experience}
      />
      <TextArea
        name="bio"
        label="自我介紹"
        required
        defaultValue={v?.bio ?? initial.bio}
        placeholder="介紹你的教學風格、專長與特色"
        errors={err?.bio}
      />

      {/* 授課方式 + 時薪 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">
            授課方式 <span className="text-red-500">*</span>
          </label>
          <select
            name="mode"
            defaultValue={v?.mode ?? initial.mode}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line"
          >
            <option value="BOTH">線上 / 實體皆可</option>
            <option value="ONLINE">僅線上</option>
            <option value="IN_PERSON">僅實體</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">
            時薪（新台幣 / 小時）
          </label>
          <div className="flex items-center gap-2">
            <input
              name="hourlyRate"
              type="number"
              defaultValue={v?.hourlyRate ?? initial.hourlyRate}
              placeholder="最低"
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line"
            />
            <span className="text-ink/40">–</span>
            <input
              name="hourlyRateMax"
              type="number"
              defaultValue={v?.hourlyRateMax ?? initial.hourlyRateMax}
              placeholder="最高"
              className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line"
            />
          </div>
          {(err?.hourlyRate ?? err?.hourlyRateMax)?.map((e) => (
            <p key={e} className="mt-1 text-xs text-red-500">
              {e}
            </p>
          ))}
          <p className="mt-1 text-xs text-ink/40">
            此為預設時薪；不同科目/年級可在下方單獨設定
          </p>
        </div>
      </div>

      {/* 各科目/年級客製時薪（連動已選專長科目） */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">
          各科目時薪（選填）
        </label>
        <p className="mb-2 text-xs text-ink/40">
          教不同科目/年級收費不同時，可在此分別設定；未列到的沿用上方預設時薪。
        </p>
        <RateRulesField subjects={subjects} initial={initial.rateRules} />
      </div>

      {/* 考試成績 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">
          考試成績（選填）
        </label>
        <p className="mb-2 text-xs text-ink/40">
          附上會考、學測、指考、多益等成績，讓家長更信任你的實力。
        </p>
        <ExamScoresField initial={initial.exams} />
      </div>

      {/* 可配合上課時間 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-ink/80">
          可配合上課時間（選填）
        </label>
        <AvailabilityField initial={initial.availability} />
      </div>

      {/* 授課地區（線上 / 選擇地區） */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink/80">
          授課地區 <span className="text-red-500">*</span>
        </legend>
        <RegionPicker name="regions" value={regions} onChange={setRegions} />
        {err?.regions?.map((e) => (
          <p key={e} className="mt-1 text-xs text-red-500">
            {e}
          </p>
        ))}
      </fieldset>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
          {state.success} ✓
        </p>
      )}

      <div className="flex flex-col items-center gap-2">
        <button
          type="submit"
          className="mx-auto block rounded-full bg-sun px-8 py-2.5 text-sm font-bold text-paper hover:bg-sun/80"
        >
          儲存檔案
        </button>
        <p className="text-center text-xs text-ink/50">
          接案開關在「面板 → 我要教學」，開啟後才會出現在「找老師」。
        </p>
      </div>
      </form>
    </>
  );
}

function TextArea({
  name,
  label,
  defaultValue,
  placeholder,
  required,
  errors,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
  errors?: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink/80">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-line"
      />
      {errors?.map((e) => (
        <p key={e} className="mt-1 text-xs text-red-500">
          {e}
        </p>
      ))}
    </div>
  );
}
