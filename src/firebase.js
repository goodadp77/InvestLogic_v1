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
   * 🚀 핵심: 도메인 일치 작업 (vercel.json의 rewrite와 세트)
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
// 구글 계정 선택창이 항상 뜨도록 설정 (세션 꼬임 방지)
provider.setCustomParameters({ prompt: 'select_account' }); 

export const db = getFirestore(app);

/**
 * 🚀 고도화된 하이브리드 로그인 함수
 * 인앱 브라우저(네이버, 카카오 등)와 일반 브라우저를 정밀하게 구분합니다.
 */
export const socialLogin = async () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // 1. 인앱 브라우저 및 모바일 환경 정밀 감지
  const isInApp = /naver|kakaotalk|line|daum|iphone|ipad|ipod|android/.test(userAgent);
  const isMobile = /iphone|ipad|ipod|android/.test(userAgent);

  try {
    // 2. 인앱 브라우저이거나 모바일인 경우 무조건 리다이렉트 방식 사용
    if (isInApp || isMobile) {
      console.log("인앱/모바일 환경 감지: 리다이렉트 로그인 실행");
      await signInWithRedirect(auth, provider);
    } else {
      // 3. 데스크톱 환경은 사용자 편의를 위해 팝업 방식 사용
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    console.error("Firebase Login Error:", error);
    
    // 구글 정책상 인앱 브라우저 차단 시 대응
    if (error.code === 'auth/disallowed-useragent') {
      alert("이 브라우저에서는 구글 로그인이 제한됩니다.\n\n오른쪽 상단 메뉴(⋮ 또는 ···)를 눌러\n'기본 브라우저로 열기' 또는 'Safari로 열기'를 선택해 주세요.");
    } else {
      alert("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }
};

// 리다이렉트 결과 처리용 export
export { signInWithRedirect, getRedirectResult };