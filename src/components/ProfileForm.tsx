"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/app/dashboard/profile/actions";
import {
  SUBJECTS,
  LEVELS,
  REGIONS,
  EDU_LEVELS,
  type TeachingMode,
  type Gender,
} from "@/lib/constants";
import Avatar from "@/components/Avatar";
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
  isPublished: boolean;
};

const initialState: ActionState = {};

export default function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [state, formAction] = useActionState(updateProfile, initialState);
  const [subjects, setSubjects] = useState<string[]>(initial.subjects);
  const [levels, setLevels] = useState<string[]>(initial.levels);
  const [regions, setRegions] = useState<string[]>(initial.regions);
  const [published, setPublished] = useState(initial.isPublished);
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

  const err = state.fieldErrors;
  // 出錯後回填剛輸入的值，沒有則用已儲存的值
  const v = state.values;

  return (
    <form action={formAction} className="space-y-6">
      {/* 頭像 */}
      <input type="hidden" name="avatarUrl" value={avatar} />
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

      {/* 發佈開關 */}
      <label className="flex items-center justify-between rounded-xl border border-line bg-sun-soft/30 p-4">
        <div>
          <span className="font-medium text-ink">公開我的檔案</span>
          <p className="text-xs text-ink/60">
            開啟後,學生才能在「找家教」列表中看到你
          </p>
        </div>
        <input
          type="checkbox"
          name="isPublished"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-5 w-5 accent-ink"
        />
      </label>

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
                  onChange={() => toggle(subjects, setSubjects, s)}
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

      {/* 可教學制 */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink/80">
          可教學制 <span className="text-red-500">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map((lv) => {
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
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
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
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
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
            className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
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
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
            />
            <span className="text-ink/40">–</span>
            <input
              name="hourlyRateMax"
              type="number"
              defaultValue={v?.hourlyRateMax ?? initial.hourlyRateMax}
              placeholder="最高"
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
            />
          </div>
          {(err?.hourlyRate ?? err?.hourlyRateMax)?.map((e) => (
            <p key={e} className="mt-1 text-xs text-red-500">
              {e}
            </p>
          ))}
          <p className="mt-1 text-xs text-ink/40">可只填一邊，例如「500 起」或固定「800」</p>
        </div>
      </div>

      {/* 授課地區（線上 / 選擇地區） */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink/80">
          授課地區 <span className="text-red-500">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => {
            const active = regions.includes(r);
            return (
              <label
                key={r}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
                  active
                    ? "border-line bg-sun text-paper"
                    : "border-line text-ink/70 hover:border-line"
                }`}
              >
                <input
                  type="checkbox"
                  name="regions"
                  value={r}
                  checked={active}
                  onChange={() => toggle(regions, setRegions, r)}
                  className="sr-only"
                />
                {r}
              </label>
            );
          })}
        </div>
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
          {!published && "（記得開啟上方「公開我的檔案」才會發佈到找老師）"}
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
          {published
            ? "存檔後會更新在「找老師」頁面。"
            : "提醒：需開啟「公開我的檔案」，存檔後才會出現在「找老師」。"}
        </p>
      </div>
    </form>
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
        className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-line"
      />
      {errors?.map((e) => (
        <p key={e} className="mt-1 text-xs text-red-500">
          {e}
        </p>
      ))}
    </div>
  );
}
