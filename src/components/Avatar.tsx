// 頭像：有 URL 顯示圖片，否則用姓名首字當底圖
const COLORS = [
  "bg-cobalt",
  "bg-mint",
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
];

export default function Avatar({
  name,
  url,
  size = 56,
}: {
  name: string;
  url?: string | null;
  size?: number;
}) {
  if (url) {
    return (
      // 頭像多為 DB 裡的 base64 data URL，next/image 幫不上忙；
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-paper ${color}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.slice(0, 1)}
    </div>
  );
}
