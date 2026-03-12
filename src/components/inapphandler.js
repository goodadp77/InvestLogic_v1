"use client";
import { useEffect } from "react";

export default function InAppHandler() {
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const targetUrl = window.location.href;

    // 🚀 인앱 브라우저 정밀 감지 (카카오, 네이버, 인스타 등)
    const isInApp = /kakaotalk|naver|line|daum|instagram|fban|fbav/.test(userAgent);

    if (isInApp) {
      // 1. iOS (아이폰) 탈출
      if (/iphone|ipad|ipod/.test(userAgent)) {
        window.location.href = `x-web-search://?${targetUrl}`;
      } 
      // 2. Android (안드로이드) 탈출
      else if (/android/.test(userAgent)) {
        const chromeUrl = `intent://${targetUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = chromeUrl;
      }
      
      // 🚀 3. 강제 탈출 실패 대비 (안전장치)
      // 화면 전체를 덮어서 인앱 로그인을 원천 봉쇄합니다.
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:white;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;text-align:center;';
      overlay.innerHTML = `
        <h2 style="margin-bottom:20px;">안전한 로그인을 위해<br/>외부 브라우저로 이동합니다</h2>
        <p style="color:#666;margin-bottom:30px;">자동으로 이동하지 않을 경우<br/>아래 버튼을 눌러주세요</p>
        <a href="${targetUrl}" target="_blank" style="padding:15px 30px;background:#0a84ff;color:white;border-radius:10px;text-decoration:none;font-weight:bold;">브라우저로 열기</a>
      `;
      document.body.appendChild(overlay);
    }
  }, []);

  return null;
}