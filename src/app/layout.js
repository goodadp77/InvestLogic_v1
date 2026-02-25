import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 🚀 수정: @ 경로 대신 상대 경로를 사용하여 참조 오류 방지
import InAppHandler from "../components/InAppHandler"; 

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
        {/* 🚀 인앱 탈출 로직이 children보다 항상 먼저 로드되도록 배치 */}
        <InAppHandler />
        {children}
      </body>
    </html>
  );
}