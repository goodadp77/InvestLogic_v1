import "./globals.css";
import InAppHandler from "../components/inapphandler"; 

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {/* 🚀 인앱 탈출 감시자 배치 */}
        <InAppHandler />
        {children}
      </body>
    </html>
  );
}