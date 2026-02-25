import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InAppHandler from "@/components/InAppHandler"; // 별도 컴포넌트로 분리하여 관리

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
        {/* 🚀 인앱 브라우저 탈출 로직 컴포넌트 */}
        <InAppHandler />
        {children}
      </body>
    </html>
  );
}