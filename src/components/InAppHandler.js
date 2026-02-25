"use client";
import { useEffect } from "react";

export default function InAppHandler() {
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const targetUrl = window.location.href;

    // 감지할 인앱 브라우저 리스트
    const isInApp = 
      userAgent.includes("kakaotalk") || 
      userAgent.includes("naver") || 
      userAgent.includes("line") || 
      userAgent.includes("fbav") || 
      userAgent.includes("instagram");

    if (isInApp) {
      // 1. iOS (iPhone/iPad/iPod) 처리: 사파리로 유도
      if (/iphone|ipad|ipod/.test(userAgent)) {
        window.location.href = `x-web-search://?${targetUrl}`;
      } 
      // 2. Android 처리: 크롬으로 유도
      else {
        window.location.href = `intent://${targetUrl.replace(/https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
      }
    }
  }, []);

  return null;
}