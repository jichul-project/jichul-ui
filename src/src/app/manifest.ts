import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "지출 관리",
    short_name: "지출 관리",
    description: "구독 서비스 지출을 한눈에 관리하세요.",
    start_url: "/subscriptions",
    display: "standalone",
    background_color: "#141412",
    theme_color: "#141412",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
