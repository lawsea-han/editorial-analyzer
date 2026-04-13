import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "사설 분석기",
  description: "AI가 사설을 30단계로 깊이 분석합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
