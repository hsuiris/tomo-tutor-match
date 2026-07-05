import { ImageResponse } from "next/og";

// 全站預設社群分享圖（LINE / FB / Twitter 卡片）
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #faf8f2 0%, #fdf3e0 100%)",
          color: "#1f2937",
        }}
      >
        <div style={{ fontSize: 140, fontWeight: 700, letterSpacing: -4 }}>
          Tomo
        </div>
        <div style={{ fontSize: 44, marginTop: 12, color: "#4b5563" }}>
          家教媒合平台
        </div>
        <div style={{ fontSize: 30, marginTop: 28, color: "#6b7280" }}>
          找家教、接案教學，一站搞定
        </div>
      </div>
    ),
    size
  );
}
