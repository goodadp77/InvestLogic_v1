// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  /**
   * 🚀 유지 사항: authDomain은 파이어베이스 기본 도메인을 사용합니다.
   * 이미 '승인된 도메인'에 Vercel 주소가 등록되어 있으므로 변경하지 않습니다.
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
 * 🚀 로그인 복구 지침 반영: 진짜 인앱 브라우저만 리다이렉트 사용
 * 일반 모바일 브라우저는 팝업 방식을 사용하여 로그인 성공률을 높입니다.
 */
export const socialLogin = async () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // 1. 진짜 인앱 브라우저(카톡, 네이버, 라인, 인스타, 페북 등)만 정밀 감지
  const isInApp = 
    userAgent.includes("kakaotalk") || 
    userAgent.includes("naver") || 
    userAgent.includes("line") || 
    userAgent.includes("daum") || 
    userAgent.includes("instagram") || 
    userAgent.includes("fban") || 
    userAgent.includes("fbav");

  try {
    // 2. 판별 결과에 따른 로그인 방식 분기
    if (isInApp) {
      console.log("진짜 인앱 환경 감지: 리다이렉트 로그인 실행");
      // 🚀 인앱 redirect session 오류 해결을 위해 persistence 설정 명시적 추가
      await setPersistence(auth, browserLocalPersistence);
      await signInWithRedirect(auth, provider);
    } else {
      // 3. 일반 모바일 브라우저(크롬, 사파리, 삼성인터넷) 및 데스크톱은 팝업 사용
      console.log("일반 브라우저 환경: 팝업 로그인 실행");
      await signInWithPopup(auth, provider);
    }
  } catch (error) {
    console.error("Firebase Login Error:", error);
    
    // 구글 정책상 인앱 브라우저 차단 시 대응
    if (error.code === 'auth/disallowed-useragent') {
      alert("이 브라우저에서는 구글 로그인이 제한됩니다.\n\n오른쪽 상단 메뉴(⋮ 또는 ···)를 눌러\n'기본 브라우저로 열기' 또는 'Safari로 열기'를 선택해 주세요.");
    } else if (error.code === 'auth/popup-blocked') {
      alert("팝업이 차단되었습니다. 브라우저 설정에서 팝업 차단을 해제해 주세요.");
    } else {
      alert("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }
};

// 리다이렉트 결과 처리용 export
export { signInWithRedirect, getRedirectResult };