// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 중복 실행 방지
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider(); 
export const db = getFirestore(app);

/**
 * 🚀 [신규 추가] 환경별 하이브리드 로그인 함수
 * 데스크톱: Popup 방식 (사용자 경험 중시)
 * 모바일: Redirect 방식 (팝업 차단 및 인앱 환경 호환성 중시)
 */
export const socialLogin = async () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android/.test(userAgent);

  try {
    if (isMobile) {
      // 모바일 환경에서는 리다이렉트로 실행
      await signInWithRedirect(auth, provider);
    } else {
      // 데스크톱 환경에서는 팝업으로 실행
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    console.error("Firebase Login Error:", error);
    if (error.code === 'auth/disallowed-useragent') {
      alert("이 브라우저에서는 구글 로그인이 제한됩니다. 크롬이나 사파리 앱을 사용해 주세요.");
    } else {
      alert("로그인 중 오류가 발생했습니다.");
    }
  }
};

// 리다이렉트 결과 처리용 export 추가
export { signInWithRedirect, getRedirectResult };