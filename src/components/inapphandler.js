"use client";
import { useEffect } from "react";

export default function InAppHandler() {
  useEffect(() => {
    // 🚨 [진단 지침] 인앱 해결 완료 전까지 무조건 alert 표시
    alert("InAppHandler 실행됨");

    const ua = navigator.userAgent.toLowerCase();
    alert("UA: " + ua);

    const targetUrl = window.location.href;
    const isInApp = /kakaotalk|naver|line|daum|instagram|fban|fbav/.test(ua);

    if (isInApp) {
      alert("인앱 브라우저 감지됨");
    } else {
      alert("일반 브라우저 감지됨");
    }
  }, []);

  return null;
}