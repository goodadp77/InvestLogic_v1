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
  // 🚀 404 에러 해결: 인앱 탈출 성공 확인 후, 인증 도메인을 다시 기본 주소로 복구합니다.
  authDomain: "nasdaq-tamagotchi.firebaseapp.com", 
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
 * 인앱 탈출 로직이 이미 작동 중이므로, 외부 브라우저 환경에서 안정적으로 로그인됩니다.
 */
export const socialLogin = async () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android/.test(userAgent);

  try {
    if (isMobile) {
      // 모바일 환경: 리다이렉트 방식 (외부 브라우저에서 실행됨)
      await signInWithRedirect(auth, provider);
    } else {
      // 데스크톱 환경: 팝업 방식
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

// 리다이렉트 결과 처리용 export 추가
export { signInWithRedirect, getRedirectResult };