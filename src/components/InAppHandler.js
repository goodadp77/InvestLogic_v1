"use client";
import { useEffect } from "react";

export default function InAppHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = navigator.userAgent.toLowerCase();
    const targetUrl = window.location.href;

    // 🚀 감지 리스트 확대 (카카오, 네이버, 인스타, 페북, 라인 등)
    const isInApp = /kakaotalk|naver|line|fbav|instagram|everytimeapp|kakao/i.test(userAgent);

    if (isInApp) {
      // 1. iOS (iPhone/iPad): 사파리 강제 호출
      if (/iphone|ipad|ipod/i.test(userAgent)) {
        // x-web-search는 iOS에서 외부 브라우저를 깨우는 가장 고전적이고 확실한 방법입니다.
        window.location.href = `x-web-search://?${targetUrl}`;
      } 
      // 2. Android: 크롬 패키지 강제 호출
      else {
        const cleanUrl = targetUrl.replace(/^https?:\/\//, "");
        // intent 방식을 사용하여 안드로이드 시스템에 크롬 실행을 직접 명령합니다.
        const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
        
        // 💡 replace와 href를 동시 실행하여 실행력을 높입니다.
        window.location.replace(intentUrl);
      }
    }
  }, []);

  return null;
}