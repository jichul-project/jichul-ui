import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "지출 관리",
  description: "구독 서비스 지출 관리",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
