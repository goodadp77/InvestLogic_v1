import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 🚀 파일명 소문자 통일 규칙에 따라 정확히 참조됨
import InAppHandler from "../components/inapphandler"; 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "InvestLogic - 스마트한 분할 매수 계산기",
  description: "NQ1! 지표 분석 기반의 전략적 분할 매수 솔루션",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* 🚀 인증 세션 꼬임을 방지하기 위해 인앱 핸들러를 최상단에 배치 */}
        <InAppHandler />
        {children}
      </body>
    </html>
  );
}