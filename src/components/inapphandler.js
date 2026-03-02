"use client";
import { useEffect } from "react";

/**
 * 🚀 [인앱 핸들러] 
 * 인앱 브라우저 환경을 감지하여 사용자 경험을 최적화합니다.
 */
export default function InAppHandler() {
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // 인앱 브라우저 여부 체크
    const isInApp = /naver|kakaotalk|line|daum|instagram|fbav/.test(userAgent);

    if (isInApp) {
      // 1. iOS(아이폰) 환경 대응
      if (/iphone|ipad|ipod/.test(userAgent)) {
        // 특정 인앱에서는 외부 브라우저 열기를 유도하는 로직이 필요할 수 있습니다.
        console.log("iOS 인앱 환경 감지");
      } 
      // 2. Android 환경 대응
      else if (/android/.test(userAgent)) {
        // 안드로이드는 인텐트(Intent)를 통해 크롬으로 강제 전환을 시도할 수 있습니다.
        console.log("Android 인앱 환경 감지");
      }
    }
  }, []);

  // 이 컴포넌트는 로직만 수행하며 별도의 UI를 렌더링하지 않거나, 
  // 필요한 경우 안내 배너를 띄울 수 있습니다.
  return null;
}