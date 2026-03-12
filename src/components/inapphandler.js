// src/components/inappHandler.js
import { useEffect } from "react";
import { auth, getRedirectResult } from "../firebase";

export default function InAppHandler() {
  useEffect(() => {
    // 🚀 인증 결과를 낚아채는 즉시 실행 함수
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("인앱 리다이렉트 성공:", result.user.email);
          // 성공 시 메인 페이지로 이동하여 세션 확정
          window.location.replace("/");
        }
      } catch (error) {
        console.error("인앱 핸들러 오류:", error);
      }
    };
    checkRedirect();
  }, []);

  return null; // 화면에는 아무것도 나타나지 않는 투명 컴포넌트입니다.
}