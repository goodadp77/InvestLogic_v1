"use client";
import { useEffect } from "react";

export default function InAppHandler() {
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const targetUrl = window.location.href;

    // 🚀 1. 인앱 브라우저 정밀 감지
    const isInApp = /kakaotalk|naver|line|daum|instagram|fban|fbav/.test(userAgent);

    if (isInApp) {
      // 인앱 브라우저의 실행 순서 꼬임을 방지하기 위해 0.1초 뒤에 실행
      setTimeout(() => {
        // 🚀 2. iOS (아이폰) - Safari 호출
        if (/iphone|ipad|ipod/.test(userAgent)) {
          window.location.href = `x-web-search://?${targetUrl}`;
        } 
        // 🚀 3. Android (안드로이드) - Chrome 호출 강화 (Intent 방식)
        else if (/android/.test(userAgent)) {
          const intentUrl = `intent://${targetUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
          window.location.href = intentUrl;
        }
      }, 100);
    }
  }, []);

  return null;
}