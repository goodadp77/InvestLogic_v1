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
   * 🚀 외부 브라우저 호출(InAppHandler) 전략으로 선회함에 따라
   * authDomain은 가장 안정적인 파이어베이스 기본 도메인으로 운용합니다.
   */
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
// 구글 계정 선택창이 항상 뜨도록 설정 (세션 꼬임 방지)
provider.setCustomParameters({ prompt: 'select_account' }); 

export const db = getFirestore(app);

/**
 * 🚀 일반 로그인 함수
 * InAppHandler가 이미 인앱 사용자를 외부 브라우저(Safari/Chrome)로 튕겨냈으므로
 * 여기서는 표준적인 팝업/리다이렉트 로직만 수행하면 됩니다.
 */
export const socialLogin = async () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android/.test(userAgent);

  try {
    // 모바일 환경은 리다이렉트, 데스크톱은 팝업 사용 (표준 정책)
    if (isMobile) {
      console.log("모바일 환경: 리다이렉트 로그인 실행");
      await signInWithRedirect(auth, provider);
    } else {
      console.log("데스크톱 환경: 팝업 로그인 실행");
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    console.error("Firebase Login Error:", error);
    
    if (error.code === 'auth/disallowed-useragent') {
      alert("이 브라우저에서는 구글 로그인이 제한됩니다.\n\n오른쪽 상단 메뉴(⋮ 또는 ···)를 눌러\n'기본 브라우저로 열기' 또는 'Safari로 열기'를 선택해 주세요.");
    } else {
      alert("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }
};

// 리다이렉트 결과 처리용 export
export { signInWithRedirect, getRedirectResult };