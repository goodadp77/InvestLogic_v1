import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// 🚀 새로 만든 감시자 임포트
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
        {/* 🚀 최상단에 배치하여 리다이렉트 결과를 가장 먼저 낚아챕니다 */}
        <InAppHandler />
        {children}
      </body>
    </html>
  );
}