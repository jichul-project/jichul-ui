import type {Metadata, Viewport} from "next";
import "./globals.css";
import {Analytics} from "@vercel/analytics/next"
import React from "react";
import {SpeedInsights} from "@vercel/speed-insights/next"

export const metadata: Metadata = {
  title: "지출 관리",
  description: "구독 서비스 지출을 한눈에 관리하세요.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "지출 관리",
  },
};

export const viewport: Viewport = {
  themeColor: "#141412",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({children}: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
      <SpeedInsights />
      <Analytics />
    </html>
  );
}
