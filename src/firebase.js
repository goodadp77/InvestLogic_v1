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
  /**
   * 🚀 핵심 수정: 도메인 일치 작업
   * vercel.json의 rewrite 설정과 짝을 이뤄 인앱 브라우저 보안을 통과합니다.
   */
  authDomain: "investlogicv1.vercel.app", 
  projectId: "nasdaq-tamagotchi", 
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
 * 🚀 하이브리드 로그인 함수
 * 인앱 브라우저에서도 세션 유실 없이 로그인을 처리하도록 리다이렉트 방식을 사용합니다.
 */
export const socialLogin = async () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android/.test(userAgent);

  try {
    if (isMobile) {
      // 모바일 환경: 도메인 일치 + 리다이렉트 조합으로 보안 돌파
      await signInWithRedirect(auth, provider);
    } else {
      // 데스크톱 환경: 팝업 방식 유지
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    console.error("Firebase Login Error:", error);
    if (error.code === 'auth/disallowed-useragent') {
      alert("이 브라우저에서는 구글 로그인이 제한됩니다. 크롬이나 사파리 앱을 사용해 주세요.");
    } else {
      alert("로그인 중 오류가 발생했습니다. 브라우저 설정을 확인해 주세요.");
    }
  }
};

// 리다이렉트 결과 처리용 export
export { signInWithRedirect, getRedirectResult };