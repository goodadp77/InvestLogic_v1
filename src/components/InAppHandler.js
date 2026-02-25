"use client";
import { useEffect } from "react";

export default function InAppHandler() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const userAgent = navigator.userAgent.toLowerCase();
    const targetUrl = window.location.href;

    // 🚀 인앱 브라우저 감지 (카카오, 네이버, 인스타, 페북 등)
    const isInApp = /kakaotalk|naver|line|fbav|instagram|everytimeapp|kakao/i.test(userAgent);

    if (isInApp) {
      // 1. iOS (iPhone/iPad) 처리: 사파리로 유도
      if (/iphone|ipad|ipod/i.test(userAgent)) {
        window.location.href = `x-web-search://?${targetUrl}`;
      } 
      // 2. Android 처리 (Chrome 강제 호출 명령어 보강)
      else {
        const cleanUrl = targetUrl.replace(/^https?:\/\//, "");
        // intent 주소를 생성하여 강제 이동
        const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
        
        // 💡 단순 href 이동이 안 먹힐 경우를 대비해 location.replace와 병행
        window.location.replace(intentUrl);
      }
    }
  }, []);

  return null;
}