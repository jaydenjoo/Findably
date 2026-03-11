import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Findably — AI 마케팅 자동화 플랫폼",
  description:
    "URL 하나로 마케팅 전체를 진단받으세요. AI가 SEO, 콘텐츠, 검색 노출을 분석하고 즉시 실행 가능한 개선안을 제공합니다.",
  keywords: ["마케팅", "SEO", "AI", "자동화", "진단"],
  openGraph: {
    title: "Findably — AI 마케팅 자동화 플랫폼",
    description: "URL 하나로 마케팅 전체를 진단받으세요",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${dmSans.variable} ${geistMono.variable} antialiased font-sans bg-gradient-to-b from-[#fafbfc] to-white`}
      >
        {children}
      </body>
    </html>
  );
}
