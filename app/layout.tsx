import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "별빛 상담실",
  description: "커튼 너머에서 나의 사주와 별 이야기를 한 장씩 만나세요.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
