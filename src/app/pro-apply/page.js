"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ShieldCheck, FileEdit, CheckCircle2, Zap } from "lucide-react";

export default function ProApplyDirect() {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 테마 설정 (기존과 동일)
  const theme = !isDarkMode ? {
    bg: "#121212", card: "#1E1E1E", text: "#FFFFFF", subText: "#A0A0A0", border: "#333333", primary: "#0A84FF"
  } : {
    bg: "#F2F2F7", card: "#FFFFFF", text: "#1C1C1E", subText: "#636366", border: "#D1D1D6", primary: "#007AFF"
  };

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    document.body.style.backgroundColor = theme.bg;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, [theme.bg]);

  // --- [직접 활성화 요청 로직 - 에러 핸들링 보완] ---
  const handleDirectApply = async () => {
    if (!user) {
      alert("로그인이 필요한 서비스입니다.");
      return;
    }
    if (!isAgreed) {
      alert("개인정보 수집 및 이용에 동의해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 구글 폼으로 나가지 않고 바로 우리 DB에 저장
      await setDoc(doc(db, "proRequests", user.uid), {
        email: user.email,
        uid: user.uid,
        status: "pending",
        requestedAt: serverTimestamp(),
        type: "direct" // 직접 신청 구분값
      });
      alert("PRO 활성화 요청이 완료되었습니다! 관리자 승인 후 즉시 반영됩니다.");
      window.location.href = "/mypage"; // 완료 후 마이페이지로 이동
    } catch (e) {
      // 🚀 [해결 포인트]: 파이어베이스 보안 규칙에 의해 막힌 경우 처리
      if (e.code === 'permission-denied') {
        alert("이미 PRO 등급이거나 현재 관리자 승인 대기 중인 상태입니다. 마이페이지에서 확인해 주세요.");
        window.location.href = "/mypage"; 
      } else {
        console.error("Apply Error Detail:", e);
        alert("요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, color: theme.text, fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '60px 20px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '45px' }}>
          <Zap size={48} color={theme.primary} style={{ marginBottom: '15px' }} />
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>PRO 기능 활성화</h1>
          <p style={{ fontSize: '16px', color: theme.subText }}>외부 양식 이동 없이 바로 신청하세요.</p>
        </div>

        {/* 안내 사항 */}
        <div style={{ backgroundColor: theme.card, borderRadius: '16px', padding: '30px', marginBottom: '20px', border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={22} color={theme.primary} /> 신청 확인 사항
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {["신청 즉시 관리자에게 알림이 전달됩니다.", "별도의 승인 절차 후 마이페이지에서 확인 가능합니다.", "계정 등급은 승인 시 자동으로 업데이트됩니다."].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '15px', lineHeight: '1.5' }}>
                <CheckCircle2 size={18} color="#34C759" style={{ marginTop: '2px' }} /> {item}
              </div>
            ))}
          </div>
        </div>

        {/* 신청 버튼 섹션 */}
        <div style={{ backgroundColor: theme.card, borderRadius: '16px', padding: '30px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
          <div style={{ textAlign: 'left', marginBottom: '25px', padding: '20px', backgroundColor: theme.bg, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
              <input 
                type="checkbox" 
                checked={isAgreed} 
                onChange={(e) => setIsAgreed(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              개인정보 수집 및 이용 동의 (필수)
            </label>
            <div style={{ marginTop: '12px', fontSize: '12px', color: theme.subText, lineHeight: '1.6' }}>
              • 수집 항목: 이메일 주소<br />
              • 이용 목적: PRO 등급 활성화 승인 및 관리<br />
              • 보유 기간: 목적 달성 후 즉시 파기
            </div>
          </div>

          <button
            onClick={handleDirectApply}
            disabled={isSubmitting}
            style={{ 
              width: '100%', padding: '20px', backgroundColor: isAgreed ? theme.primary : theme.border, 
              color: '#FFFFFF', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '18px', 
              cursor: isAgreed ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
            }}
          >
            {isSubmitting ? "처리 중..." : "지금 바로 활성화 요청하기"}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button onClick={() => window.location.href = '/'} style={{ background: 'none', border: 'none', color: theme.subText, textDecoration: 'underline', cursor: 'pointer' }}>홈으로 돌아가기</button>
        </div>
      </div>
    </div>
  );
}