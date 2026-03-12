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
 * 🚀 구글 로그인 정상화 함수
 * InAppHandler가 이미 사용자를 외부 브라우저로 이동시켰으므로,
 * 세션 유실 방지를 위해 signInWithPopup을 우선적으로 사용합니다.
 */
export const socialLogin = async () => {
  try {
    // 🚀 [최종 지침 반영] 외부 브라우저에서는 팝업 로그인을 최우선 시도
    // 모바일/데스크톱 구분 없이 팝업을 먼저 띄워 세션 끊김을 방지합니다.
    console.log("구글 팝업 로그인 시도...");
    const result = await signInWithPopup(auth, provider);
    console.log("로그인 성공:", result.user);
    
  } catch (error) {
    console.error("Firebase Login Error (Popup):", error);
    
    // 구글 정책상 인앱 브라우저 차단 시 대응
    if (error.code === 'auth/disallowed-useragent') {
      alert("이 브라우저에서는 구글 로그인이 제한됩니다.\n\n오른쪽 상단 메뉴(⋮ 또는 ···)를 눌러\n'기본 브라우저로 열기' 또는 'Safari로 열기'를 선택해 주세요.");
      return;
    }

    // 팝업이 차단되었거나 실패한 경우 리다이렉트 방식으로 백업 실행
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
      console.log("팝업 차단 감지: 리다이렉트 방식으로 전환합니다.");
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectError) {
        console.error("Redirect 로그인 에러:", redirectError);
      }
    } else {
      alert("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }
};

// 리다이렉트 결과 처리용 export
export { signInWithRedirect, getRedirectResult };