// 安全認證徽章：顯示使用者通過的認證項目
export default function TrustBadges({
  idVerified,
  bgCheckVerified,
  eduVerified = false,
  size = "sm",
}: {
  idVerified: boolean;
  bgCheckVerified: boolean;
  eduVerified?: boolean;
  size?: "sm" | "xs";
}) {
  if (!idVerified && !bgCheckVerified && !eduVerified) return null;

  const pad = size === "xs" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  // 深綠底 + 白字
  const badge = `inline-flex items-center gap-0.5 rounded-full bg-cobalt font-medium text-paper ${pad}`;

  return (
    <span className="flex flex-wrap items-center gap-1">
      {idVerified && <span className={badge}>✓ 實名</span>}
      {bgCheckVerified && <span className={badge}>✓ 無犯罪紀錄</span>}
      {eduVerified && <span className={badge}>✓ 學歷成績</span>}
    </span>
  );
}
