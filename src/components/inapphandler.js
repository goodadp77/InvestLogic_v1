"use client";
import { useEffect } from "react";
import { auth, getRedirectResult } from "../firebase";

export default function InAppHandler() {
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        // 🚀 리다이렉트된 인증 결과를 확인
        const result = await getRedirectResult(auth);
        if (result?.user) {
          // 인증 성공 시 세션 동기화를 위해 페이지 새로고침(또는 이동)
          window.location.replace("/");
        }
      } catch (error) {
        console.error("InApp Auth Redirect Error:", error);
      }
    };
    checkRedirect();
  }, []);

  return null; // UI 없이 로직만 수행
}