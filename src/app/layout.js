// src/app/layout.js
import "./globals.css";
import InAppHandler from "../components/inappHandler"; // 🚀 추가

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <InAppHandler /> {/* 🚀 최상단에 배치 */}
        {children}
      </body>
    </html>
  );
}