"use client";
import { useEffect } from "react";

export default function InAppHandler() {
  useEffect(() => {
    // 🚀 [진단 지침 5번] 실행 확인용 테스트 코드 추가
    console.log("INAPP HANDLER START");
    alert("INAPP HANDLER START");

    const userAgent = navigator.userAgent.toLowerCase();
    const targetUrl = window.location.href;

    // 🚀 1. 인앱 브라우저 정밀 감지
    const isInApp = /kakaotalk|naver|line|daum|instagram|fban|fbav/.test(userAgent);

    if (isInApp) {
      // 🚀 2. iOS (아이폰) - x-web-search 스킴을 이용한 Safari 호출
      if (/iphone|ipad|ipod/.test(userAgent)) {
        window.location.href = `x-web-search://?${targetUrl}`;
      } 
      // 🚀 3. Android (안드로이드) - Intent 스킴을 이용한 Chrome 호출
      else if (/android/.test(userAgent)) {
        window.location.href = `intent://${targetUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
      }
    }
  }, []);

  return null;
}