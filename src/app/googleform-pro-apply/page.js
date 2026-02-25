"use client";
import { useState, useEffect } from "react";
import { auth } from "../../firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { ShieldCheck, FileEdit, CheckCircle2, ExternalLink } from "lucide-react";

// --- [컴포넌트 1: 상단 네비게이션] ---
const TopNav = ({ user, theme }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div style={{ width: '100%', backgroundColor: theme.card, borderBottom: `1px solid ${theme.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 'bold', color: theme.text, cursor: 'pointer' }} onClick={() => window.location.href='/'}>🥚 InvestLogic</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: theme.text }}>☰</button>
            {isMenuOpen && (
              <div style={{ position: 'absolute', top: '45px', right: '0', width: '200px', backgroundColor: theme.card, border: `1px solid ${theme.border}`, borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 1000 }}>
                <div onClick={() => window.location.href='/'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text }}>🏠 홈</div>
                <div onClick={() => window.location.href='/stocklab'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text }}>🔍 종목탐구 LAB</div>
                <div onClick={() => window.location.href='/pro-guide'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text }}>💎 PRO 등급 안내</div>
                <div onClick={() => window.location.href='/mypage'} style={{ padding: '12px 15px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', color: theme.text }}>⚙️ 마이페이지</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProApply() {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  // 구글 폼 URL (운영자 주소로 교체 가능)
  const googleFormUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfWgHevmewJwgcNY6mntC-neJlswAyQ-e8IU9x9_5u6lSoEJA/viewform";

  // 🔥 크롬 확장프로그램 대응 테마 반전 (라이트일 때 어두운 테마)
  const theme = !isDarkMode ? {
    bg: "#121212", card: "#1E1E1E", text: "#FFFFFF", subText: "#A0A0A0", border: "#333333", primary: "#0A84FF", accentBg: "#2C2C2E"
  } : {
    bg: "#F2F2F7", card: "#FFFFFF", text: "#1C1C1E", subText: "#636366", border: "#D1D1D6", primary: "#007AFF", accentBg: "#F2F2F7"
  };

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    const handler = (e) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handler);
    document.body.style.backgroundColor = theme.bg;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => { unsubscribe(); darkModeMediaQuery.removeEventListener('change', handler); };
  }, [theme.bg]);

  const sectionStyle = { backgroundColor: theme.card, borderRadius: '16px', padding: '30px', marginBottom: '20px', border: `1px solid ${theme.border}` };
  const titleStyle = { fontSize: '19px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: theme.text };

  return (
    <div style={{ minHeight: '100vh', fontFamily: '-apple-system, sans-serif', backgroundColor: theme.bg, color: theme.text }}>
      <TopNav user={user} theme={theme} />

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '45px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px', color: theme.text }}>
            PRO 등급 신청하기
          </h1>
          <p style={{ fontSize: '16px', color: theme.subText }}>
            전략 기능을 확장하여 더 정교한 계산을 시작하세요.
          </p>
        </div>

        {/* 안내 사항 */}
        <div style={sectionStyle}>
          <div style={titleStyle}><ShieldCheck size={22} color={theme.primary} /> 신청 전 확인해 주세요</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              "신청 정보 확인 후 관리자 승인 후 등급이 조정됩니다.",
              "승인 완료 시 마이페이지에서 'PRO회원' 표기를 확인할 수 있습니다.",
              "신청 시 사용 중인 계정의 이메일 정보가 필요합니다."
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '15px', color: theme.text, lineHeight: '1.5' }}>
                <CheckCircle2 size={18} color="#34C759" style={{ marginTop: '2px' }} /> {item}
              </div>
            ))}
          </div>
        </div>

        {/* 신청 방식 단일화 */}
        <div style={sectionStyle}>
          <div style={{ textAlign: 'center' }}>
            <FileEdit size={40} color={theme.primary} style={{ marginBottom: '15px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>신청 양식 작성</h3>
            <p style={{ fontSize: '14px', color: theme.subText, marginBottom: '30px', lineHeight: '1.6' }}>
              외부 신청 양식으로 이동하여<br />정보를 입력해 주시면 확인 후 승인해 드립니다.
            </p>

            {/* 개인정보 수집·이용 동의 */}
            <div style={{ textAlign: 'left', marginBottom: '25px', padding: '15px', backgroundColor: theme.bg, borderRadius: '10px', border: `1px solid ${theme.border}` }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                <input 
                  type="checkbox" 
                  checked={isAgreed} 
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                개인정보 수집·이용에 동의합니다 (필수)
                <a 
                  href="/privacy-policy" 
                  target="_blank" 
                  style={{ marginLeft: 'auto', fontSize: '12px', color: theme.primary, textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  내용 보기 <ExternalLink size={12} />
                </a>
              </label>

              {/* 동의 안내 문구 */}
              <div style={{ marginTop: '12px', fontSize: '11px', color: theme.subText, lineHeight: '1.6' }}>
                • 수집 항목: 이메일<br />
                • 이용 목적: PRO 등급 신청 확인 및 승인 처리<br />
                • 보관 기간: 승인 처리 완료 후 즉시 파기
              </div>
            </div>

            <button 
              onClick={() => window.open(googleFormUrl, '_blank')}
              disabled={!isAgreed}
              style={{ 
                width: '100%', 
                padding: '18px', 
                backgroundColor: isAgreed ? theme.primary : theme.border, 
                color: isAgreed ? '#FFFFFF' : theme.subText, 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 'bold', 
                fontSize: '17px', 
                cursor: isAgreed ? 'pointer' : 'not-allowed',
                boxShadow: isAgreed ? '0 4px 15px rgba(0, 122, 255, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              PRO 신청하기
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => window.location.href = '/'}
            style={{ background: 'none', border: 'none', color: theme.subText, textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' }}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}