import type { SVGProps } from "react";

// 圓潤飽滿的可愛愛心：大圓弧雙瓣、淺凹槽、收尾柔順
export default function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 20.7C12 20.7 2.5 14.7 2.5 8.4C2.5 5.5 4.7 3.6 7.3 3.6C9.4 3.6 11.1 5 12 6.9C12.9 5 14.6 3.6 16.7 3.6C19.3 3.6 21.5 5.5 21.5 8.4C21.5 14.7 12 20.7 12 20.7Z" />
    </svg>
  );
}
