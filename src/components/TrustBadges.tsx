// 安全認證徽章：顯示使用者通過的認證項目
export default function TrustBadges({
  idVerified,
  eduVerified = false,
  size = "sm",
}: {
  idVerified: boolean;
  // ponytail: 已不顯示無犯罪紀錄徽章，保留 prop 讓舊呼叫處不用改
  bgCheckVerified?: boolean;
  eduVerified?: boolean;
  size?: "sm" | "xs";
}) {
  if (!idVerified && !eduVerified) return null;

  const pad = size === "xs" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  // 玻璃感：半透明白底 + 模糊 + 細邊框、灰字
  const badge = `inline-flex items-center rounded-full border border-ink/10 bg-white/50 shadow-sm backdrop-blur-sm font-medium text-ink/60 ${pad}`;

  return (
    <span className="flex flex-wrap items-center gap-1">
      {idVerified && <span className={badge}>實名認證</span>}
      {eduVerified && <span className={badge}>學歷成績認證</span>}
    </span>
  );
}
