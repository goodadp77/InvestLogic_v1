import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
        {/* 🚀 InAppHandler 제거됨: 인앱 강제 브라우저 이동 없이 로그인 버튼 클릭 시 로직 작동 */}
        {children}
      </body>
    </html>
  );
}