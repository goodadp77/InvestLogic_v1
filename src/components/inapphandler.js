"use client";
import { useEffect } from "react";

export default function InAppHandler() {
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const targetUrl = window.location.href;

    // 🚀 인앱 브라우저 정밀 감지 (기존 목록에 kakaowork, wv 추가 유지)
    const isInApp = /kakaotalk|kakaowork|naver|line|daum|instagram|fban|fbav|wv/.test(ua);

    if (isInApp) {
      // 1. iOS (아이폰/패드) -> Safari 강제 호출
      if (/iphone|ipad|ipod/.test(ua)) {
        window.location.href = `x-web-search://?${targetUrl}`;
      } 
      // 2. Android (안드로이드) -> Chrome Intent 호출
      else if (/android/.test(ua)) {
        const cleanUrl = targetUrl.replace(/^https?:\/\//, "");
        window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      }
    }
  }, []);

  return null;
}